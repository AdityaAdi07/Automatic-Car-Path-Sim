import { Position, PathNode, TrafficCondition, Pedestrian, VehicleParameters } from '../types/simulation';
import { warehouseStorageUnits } from '../components/SimulationMap';

export class PathfindingEngine {
  private gridSize: number = 5;
  private mapWidth: number = 800;
  private mapHeight: number = 600;

  // Add city buildings and roads as static properties for city map
  static cityBuildings = [
    { x: 150, y: 150, width: 120, height: 200 },
    { x: 400, y: 100, width: 180, height: 120 },
    { x: 600, y: 300, width: 120, height: 200 },
    { x: 250, y: 400, width: 200, height: 120 },
    { x: 500, y: 450, width: 100, height: 100 }
  ];
  static cityRoads = [
    // Horizontal roads
    { x: 0, y: 90, width: 800, height: 40 },
    { x: 0, y: 300, width: 800, height: 40 },
    { x: 0, y: 510, width: 800, height: 40 },
    // Vertical roads
    { x: 90, y: 0, width: 40, height: 600 },
    { x: 300, y: 0, width: 40, height: 600 },
    { x: 510, y: 0, width: 40, height: 600 },
    { x: 720, y: 0, width: 40, height: 600 }
  ];

  // Utility to check if a point is inside any rectangle
  static isInsideRect(x: number, y: number, rect: { x: number; y: number; width: number; height: number }, buffer = 0): boolean {
    return x >= rect.x - buffer && x <= rect.x + rect.width + buffer &&
           y >= rect.y - buffer && y <= rect.y + rect.height + buffer;
  }
  static isOnAnyRoad(x: number, y: number): boolean {
    return PathfindingEngine.cityRoads.some(r => PathfindingEngine.isInsideRect(x, y, r));
  }
  static isInAnyBuilding(x: number, y: number, buffer = 20): boolean {
    return PathfindingEngine.cityBuildings.some(b => PathfindingEngine.isInsideRect(x, y, b, buffer));
  }

  constructor(mapWidth: number = 800, mapHeight: number = 600) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  // Calculate distance between two positions
  private getDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  // Calculate heuristic cost (Manhattan distance with diagonal adjustment)
  private getHeuristic(pos1: Position, pos2: Position): number {
    const dx = Math.abs(pos2.x - pos1.x);
    const dy = Math.abs(pos2.y - pos1.y);
    // Octile distance for better diagonal movement
    return Math.max(dx, dy) + (Math.sqrt(2) - 1) * Math.min(dx, dy);
  }

  // Modified getNeighbors to support city map constraints
  private getNeighbors(position: Position, mapType: 'warehouse' | 'city' = 'warehouse', fromInsideBuilding = false): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -this.gridSize }, // up
      { x: this.gridSize, y: 0 }, // right
      { x: 0, y: this.gridSize }, // down
      { x: -this.gridSize, y: 0 }, // left
      { x: this.gridSize, y: -this.gridSize }, // up-right
      { x: this.gridSize, y: this.gridSize }, // down-right
      { x: -this.gridSize, y: this.gridSize }, // down-left
      { x: -this.gridSize, y: -this.gridSize } // up-left
    ];
    for (let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      const newPos = { x: position.x + dir.x, y: position.y + dir.y };
      if (newPos.x >= 0 && newPos.x < this.mapWidth && newPos.y >= 0 && newPos.y < this.mapHeight) {
        if (mapType === 'city') {
          const inBuilding = PathfindingEngine.isInAnyBuilding(newPos.x, newPos.y);
          if (!inBuilding || fromInsideBuilding) {
            neighbors.push(newPos);
          }
        } else {
          // Warehouse mode: block storage units with 5px gap
          if (!isInAnyStorageUnit(newPos.x, newPos.y, 8)) {
            // Check that the segment from position to newPos does not cross a storage unit
            let crossesObstacle = false;
            const steps = 10;
            for (let s = 1; s <= steps; s++) {
              const t = s / steps;
              const x = position.x + (newPos.x - position.x) * t;
              const y = position.y + (newPos.y - position.y) * t;
              if (isInAnyStorageUnit(x, y, 8)) {
                crossesObstacle = true;
                break;
              }
            }
            if (!crossesObstacle) {
              neighbors.push(newPos);
            }
          }
        }
      }
    }
    return neighbors;
  }

  // Enhanced cost calculation with better traffic and pedestrian handling
  private calculateCost(
    from: Position,
    to: Position,
    traffic: TrafficCondition[],
    pedestrians: Pedestrian[],
    vehicleParams: VehicleParameters,
    mapType: 'warehouse' | 'city' = 'warehouse'
  ): number {
    let baseCost = this.getDistance(from, to);

    // Buildings as high-severity traffic in city map
    if (mapType === 'city' && PathfindingEngine.isInAnyBuilding(to.x, to.y)) {
      return 1_000_000; // Extremely high cost, triggers rerouting
    }

    // Introduce a small additional cost to encourage diversions
    baseCost += 5; // A small constant cost to make less direct paths more appealing

    // Enhanced traffic penalty with distance-based falloff
    for (const trafficCondition of traffic) {
      const distanceToTraffic = this.getDistance(to, trafficCondition.position);
      if (distanceToTraffic <= trafficCondition.affectedRadius) {
        // If high severity traffic, make it extremely costly to avoid, but not completely impassable
        if (trafficCondition.severity === 'high') {
          return 1_000_000; // A very high cost to strongly discourage this path segment
        }

        const falloffFactor = 1 - (distanceToTraffic / trafficCondition.affectedRadius);
        const severityMultiplier = trafficCondition.severity === 'medium' ? 2.5 : 1.5; // Only for medium/low
        baseCost *= (1 + severityMultiplier * falloffFactor);
      }
    }

    // Enhanced pedestrian penalty with blocking consideration
    for (const pedestrian of pedestrians) {
      const distanceToPedestrian = this.getDistance(to, pedestrian.position);
      if (distanceToPedestrian <= 40) {
        const proximityFactor = Math.max(0, 1 - (distanceToPedestrian / 40));
        if (pedestrian.isBlocking) {
          baseCost += 100 * proximityFactor; // Heavy penalty for blocking pedestrians
        } else {
          baseCost += 20 * proximityFactor; // Light penalty for moving pedestrians
        }
      }
    }

    // Enhanced vehicle condition penalties
    if (vehicleParams.batteryPercentage < 20) {
      // Prefer shorter routes when battery is low
      baseCost *= 0.7; // Actually prefer shorter paths
    } else if (vehicleParams.batteryPercentage < 40) {
      baseCost *= 0.9;
    }

    // Tire pressure affects maneuverability
    if (vehicleParams.tirePressure < 75) {
      baseCost *= 1.4; // Avoid complex routes with low tire pressure
    } else if (vehicleParams.tirePressure < 85) {
      baseCost *= 1.2;
    }

    // Speed-based cost adjustment
    const speedRatio = vehicleParams.speed / vehicleParams.initialSpeed;
    if (speedRatio < 0.7) {
      baseCost *= 1.3; // Higher cost for slow movement
    }

    return baseCost;
  }

  // Accept mapType in findPath and use it in getNeighbors
  public findPath(
    start: Position,
    goal: Position,
    traffic: TrafficCondition[],
    pedestrians: Pedestrian[],
    vehicleParams: VehicleParameters,
    mapType: 'warehouse' | 'city' = 'warehouse'
  ): Position[] {
    const openSet: PathNode[] = [];
    const closedSet: Set<string> = new Set();
    const gScores: Map<string, number> = new Map();
    const startNode: PathNode = {
      position: start,
      gCost: 0,
      hCost: this.getHeuristic(start, goal),
      fCost: 0,
      parent: null
    };
    startNode.fCost = startNode.gCost + startNode.hCost;
    openSet.push(startNode);
    gScores.set(`${start.x},${start.y}`, 0);
    let iterations = 0;
    const maxIterations = 500000;
    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++;
      openSet.sort((a, b) => a.fCost - b.fCost);
      const currentNode = openSet.shift()!;
      const posKey = `${currentNode.position.x},${currentNode.position.y}`;
      if (closedSet.has(posKey)) continue;
      closedSet.add(posKey);
      if (this.getDistance(currentNode.position, goal) < this.gridSize * 5) {
        const path: Position[] = [];
        let current: PathNode | null = currentNode;
        while (current !== null) {
          path.unshift(current.position);
          current = current.parent;
        }
        if (path.length === 0 || this.getDistance(path[path.length - 1], goal) > 1) {
            path.push(goal);
        }
        return this.smoothPath(path, mapType);
      }
      // Use mapType in getNeighbors, and allow escaping from building
      const fromInsideBuilding = mapType === 'city' && PathfindingEngine.isInAnyBuilding(currentNode.position.x, currentNode.position.y);
      const neighbors = this.getNeighbors(currentNode.position, mapType, fromInsideBuilding);
      for (const neighborPos of neighbors) {
        const neighborKey = `${neighborPos.x},${neighborPos.y}`;
        if (closedSet.has(neighborKey)) continue;
        const moveCost = this.calculateCost(
          currentNode.position,
          neighborPos,
          traffic,
          pedestrians,
          vehicleParams,
          mapType
        );
        const tentativeGCost = currentNode.gCost + moveCost;
        const existingGCost = gScores.get(neighborKey) || Infinity;
        if (tentativeGCost < existingGCost) {
          gScores.set(neighborKey, tentativeGCost);
          const existingNode = openSet.find(node => 
            node.position.x === neighborPos.x && node.position.y === neighborPos.y
          );
          if (!existingNode) {
            const neighborNode: PathNode = {
              position: neighborPos,
              gCost: tentativeGCost,
              hCost: this.getHeuristic(neighborPos, goal),
              fCost: 0,
              parent: currentNode
            };
            neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;
            openSet.push(neighborNode);
          } else {
            existingNode.gCost = tentativeGCost;
            existingNode.fCost = existingNode.gCost + existingNode.hCost;
            existingNode.parent = currentNode;
          }
        }
      }
    }
    return [];
  }

  // Create a direct path when A* fails
  private createDirectPath(start: Position, goal: Position): Position[] {
    const path: Position[] = [start];
    const distance = this.getDistance(start, goal);
    const steps = Math.ceil(distance / this.gridSize);
    
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      path.push({
        x: start.x + (goal.x - start.x) * t,
        y: start.y + (goal.y - start.y) * t
      });
    }
    
    path.push(goal);
    return path;
  }

  // Smooth the path to reduce unnecessary waypoints
  private smoothPath(path: Position[], mapType: 'warehouse' | 'city' = 'warehouse'): Position[] {
    if (path.length <= 2) return path;

    const smoothed: Position[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let farthest = current + 1;
      // Find the farthest point we can reach in a straight line, but don't skip too many points at once
      for (let i = current + 2; i < path.length; i++) {
        // Only allow skipping up to 2 intermediate points for more detailed paths
        // And ensure we don't skip the very last point of the path
        if (i - current > 3 || i === path.length - 1) break;

        if (this.hasLineOfSight(path[current], path[i], mapType)) {
          farthest = i;
        } else {
          break;
        }
      }
      smoothed.push(path[farthest]);
      current = farthest;
    }
    // Ensure the last point in the smoothed path is the original last point (goal)
    if (smoothed[smoothed.length - 1] !== path[path.length - 1]) {
        smoothed.push(path[path.length - 1]);
    }
    return smoothed;
  }

  // Check if there's a clear line of sight between two points
  private hasLineOfSight(pos1: Position, pos2: Position, mapType: 'warehouse' | 'city' = 'warehouse'): boolean {
    const distance = this.getDistance(pos1, pos2);
    const steps = Math.ceil(distance / this.gridSize);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkPos = {
        x: pos1.x + (pos2.x - pos1.x) * t,
        y: pos1.y + (pos2.y - pos1.y) * t
      };
      // Check if position is within map bounds
      if (checkPos.x < 0 || checkPos.x >= this.mapWidth || checkPos.y < 0 || checkPos.y >= this.mapHeight) {
        return false;
      }
      if (mapType === 'city') {
        if (PathfindingEngine.isInAnyBuilding(checkPos.x, checkPos.y, 5)) {
          return false;
        }
      } else if (mapType === 'warehouse') {
        if (isInAnyStorageUnit(checkPos.x, checkPos.y, 8)) {
          return false;
        }
      }
    }
    return true;
  }

  // Simplified Dijkstra's algorithm for comparison
  public findPathDijkstra(
    start: Position,
    goal: Position,
    traffic: TrafficCondition[],
    pedestrians: Pedestrian[],
    vehicleParams: VehicleParameters
  ): Position[] {
    // Implementation remains the same but with enhanced cost calculation
    const distances: Map<string, number> = new Map();
    const previous: Map<string, Position | null> = new Map();
    const unvisited: Set<string> = new Set();

    // Initialize distances
    for (let x = 0; x < this.mapWidth; x += this.gridSize) {
      for (let y = 0; y < this.mapHeight; y += this.gridSize) {
        const key = `${x},${y}`;
        distances.set(key, Infinity);
        previous.set(key, null);
        unvisited.add(key);
      }
    }

    const startKey = `${start.x},${start.y}`;
    distances.set(startKey, 0);

    while (unvisited.size > 0) {
      let currentKey: string | null = null;
      let minDistance = Infinity;

      for (const key of unvisited) {
        const distance = distances.get(key) || Infinity;
        if (distance < minDistance) {
          minDistance = distance;
          currentKey = key;
        }
      }

      if (!currentKey || minDistance === Infinity) break;

      unvisited.delete(currentKey);
      const [x, y] = currentKey.split(',').map(Number);
      const currentPos = { x, y };

      if (this.getDistance(currentPos, goal) < this.gridSize) {
        const path: Position[] = [];
        let current: string | null = currentKey;
        while (current && previous.get(current)) {
          const [px, py] = current.split(',').map(Number);
          path.unshift({ x: px, y: py });
          const prev = previous.get(current);
          current = prev ? `${prev.x},${prev.y}` : null;
        }
        path.unshift(start);
        return this.smoothPath(path);
      }

      const neighbors = this.getNeighbors(currentPos);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!unvisited.has(neighborKey)) continue;

        const cost = this.calculateCost(currentPos, neighbor, traffic, pedestrians, vehicleParams);
        const altDistance = minDistance + cost;

        if (altDistance < (distances.get(neighborKey) || Infinity)) {
          distances.set(neighborKey, altDistance);
          previous.set(neighborKey, currentPos);
        }
      }
    }

    return this.createDirectPath(start, goal);
  }
}

// Helper: check if a point is inside or within 'gap' px of any warehouse storage unit
export function isInAnyStorageUnit(x: number, y: number, gap: number = 8): boolean {
  for (const unit of warehouseStorageUnits) {
    if (
      x >= unit.x - gap &&
      x <= unit.x + unit.width + gap &&
      y >= unit.y - gap &&
      y <= unit.y + unit.height + gap
    ) {
      return true;
    }
  }
  return false;
}