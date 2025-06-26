import { 
  Vehicle, 
  VehicleParameters, 
  Position, 
  TrafficCondition, 
  Pedestrian, 
  LogEntry 
} from '../types/simulation';
import { PathfindingEngine, isInAnyStorageUnit } from './pathfinding';
import { warehouseStorageUnits } from '../components/SimulationMap';

export class SimulationEngine {
  private pathfinder: PathfindingEngine;
  private logs: LogEntry[] = [];
  private _onDestinationReached: ((vehicleId: string) => void) | null = null;
  private mapType: 'warehouse' | 'city' = 'warehouse';

  constructor() {
    this.pathfinder = new PathfindingEngine();
  }

  public setDestinationReachedCallback(callback: (vehicleId: string) => void) {
    this._onDestinationReached = callback;
  }

  public setMapType(mapType: 'warehouse' | 'city') {
    this.mapType = mapType;
  }

  // Create initial vehicle with default parameters
  public createVehicle(id: string, startPosition: Position, initialRoute: Position[] = []): Vehicle {
    const defaultParams: VehicleParameters = {
      batteryPercentage: 85,
      fuelConsumptionPerBlock: 0.5,
      tirePressure: 95,
      speed: 30,
      initialSpeed: 30,
      mileage: 25000,
      maxBatteryCapacity: 100,
      maxFuelCapacity: 50
    };
    // For city map, ensure vehicle spawns on a road and not inside a building
    let pos = startPosition;
    if (this.mapType === 'city') {
      let tries = 0;
      while ((!PathfindingEngine.isOnAnyRoad(pos.x, pos.y) || PathfindingEngine.isInAnyBuilding(pos.x, pos.y, 10)) && tries < 20) {
        pos = { x: Math.random() * 800, y: Math.random() * 600 };
        tries++;
      }
    }
    return {
      id,
      position: pos,
      parameters: defaultParams,
      route: initialRoute.length > 0 ? initialRoute : [pos],
      currentRouteIndex: 0,
      isMoving: false,
      lastDecision: 'Initialized',
      totalDistance: 0
    };
  }

  // Generate random traffic conditions
  public generateTrafficConditions(count: number = 5): TrafficCondition[] {
    const traffic: TrafficCondition[] = [];
    const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    for (let i = 0; i < count; i++) {
      let pos = { x: Math.random() * 800, y: Math.random() * 600 };
      if (this.mapType === 'city') {
        let tries = 0;
        while ((!PathfindingEngine.isOnAnyRoad(pos.x, pos.y) || PathfindingEngine.isInAnyBuilding(pos.x, pos.y, 10)) && tries < 20) {
          pos = { x: Math.random() * 800, y: Math.random() * 600 };
          tries++;
        }
      }
      traffic.push({
        position: pos,
        severity: severities[Math.floor(Math.random() * severities.length)],
        affectedRadius: 40 + Math.random() * 60
      });
    }
    return traffic;
  }

  // Generate pedestrians with more realistic behavior
  public generatePedestrians(): Pedestrian[] {
    const pedestrians: Pedestrian[] = [];
    const numPedestrians = Math.floor(Math.random() * 5) + 8; // 8-12 pedestrians
    for (let i = 0; i < numPedestrians; i++) {
      let start = { x: Math.random() * 800, y: Math.random() * 600 };
      let dest = { x: Math.random() * 800, y: Math.random() * 600 };
      if (this.mapType === 'city') {
        let tries = 0;
        while ((!PathfindingEngine.isOnAnyRoad(start.x, start.y) || PathfindingEngine.isInAnyBuilding(start.x, start.y, 10)) && tries < 20) {
          start = { x: Math.random() * 800, y: Math.random() * 600 };
          tries++;
        }
        tries = 0;
        while ((!PathfindingEngine.isOnAnyRoad(dest.x, dest.y) || PathfindingEngine.isInAnyBuilding(dest.x, dest.y, 10)) && tries < 20) {
          dest = { x: Math.random() * 800, y: Math.random() * 600 };
          tries++;
        }
      }
      pedestrians.push({
        id: `PED-${String(i + 1).padStart(3, '0')}`,
        position: start,
        destination: dest,
        speed: 10 + Math.random() * 10, // 10-20 units per second
        isBlocking: true // All pedestrians are blocking by default
      });
    }
    return pedestrians;
  }

  // Check if pedestrian is in vehicle's path (forward detection cone)
  private checkPedestrianBlocking(
    vehicle: Vehicle,
    pedestrians: Pedestrian[]
  ): { status: 'none' | 'detected' | 'slow' | 'stop', pedestrian?: Pedestrian } {
    if (!vehicle.isMoving || vehicle.currentRouteIndex >= vehicle.route.length - 1) {
      return { status: 'none' };
    }

    const pedestrianRadius = 8;
    const detectionDistance = pedestrianRadius * 10;
    const stopDistance = 8;
    const currentPos = vehicle.position;
    const nextPos = vehicle.route[vehicle.currentRouteIndex + 1];
    const direction = {
      x: nextPos.x - currentPos.x,
      y: nextPos.y - currentPos.y
    };
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const normalizedDir = {
      x: direction.x / length,
      y: direction.y / length
    };

    for (const pedestrian of pedestrians) {
      const toPedestrian = {
        x: pedestrian.position.x - currentPos.x,
        y: pedestrian.position.y - currentPos.y
      };
      const distance = Math.sqrt(toPedestrian.x * toPedestrian.x + toPedestrian.y * toPedestrian.y);
      const dotProduct = toPedestrian.x * normalizedDir.x + toPedestrian.y * normalizedDir.y;
      if (dotProduct <= 0) continue;
      const lateralDistance = Math.abs(
        toPedestrian.x * normalizedDir.y - toPedestrian.y * normalizedDir.x
      );
      // Predictive collision check
      const pedDir = {
        x: pedestrian.destination.x - pedestrian.position.x,
        y: pedestrian.destination.y - pedestrian.position.y
      };
      const pedLen = Math.sqrt(pedDir.x * pedDir.x + pedDir.y * pedDir.y);
      if (pedLen === 0) continue;
      const pedNorm = { x: pedDir.x / pedLen, y: pedDir.y / pedLen };
      const pedNext = {
        x: pedestrian.position.x + pedNorm.x * pedestrian.speed * 1,
        y: pedestrian.position.y + pedNorm.y * pedestrian.speed * 1
      };
      const vehNext = nextPos;
      const willIntersect = this.segmentsIntersect(currentPos, vehNext, pedestrian.position, pedNext);
      if (lateralDistance < 15 && distance < detectionDistance || willIntersect) {
        if (distance <= stopDistance) {
          return { status: 'stop', pedestrian };
        } else if (distance <= detectionDistance) {
          return { status: 'slow', pedestrian };
        } else {
          return { status: 'detected', pedestrian };
        }
      }
    }
    return { status: 'none' };
  }

  // Helper: check if two line segments intersect
  private segmentsIntersect(a1: Position, a2: Position, b1: Position, b2: Position): boolean {
    function ccw(p1: Position, p2: Position, p3: Position) {
      return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
    }
    return (
      ccw(a1, b1, b2) !== ccw(a2, b1, b2) &&
      ccw(a1, a2, b1) !== ccw(a1, a2, b2)
    );
  }

  // Check if traffic condition is in vehicle's path (forward detection cone)
  private isTrafficInPath(vehicle: Vehicle, trafficCondition: TrafficCondition): boolean {
    // If vehicle has no next waypoint, no need to check for traffic in path
    if (!vehicle.isMoving || vehicle.route.length <= vehicle.currentRouteIndex + 1) {
      return false;
    }

    const vehiclePos = vehicle.position;
    const targetPos = vehicle.route[vehicle.currentRouteIndex + 1];
    const trafficPos = trafficCondition.position;

    // Calculate direction vector from vehicle to target
    const dirX = targetPos.x - vehiclePos.x;
    const dirY = targetPos.y - vehiclePos.y;
    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);

    if (dirLength === 0) return false;

    // Normalize direction vector
    const normDirX = dirX / dirLength;
    const normDirY = dirY / dirLength;

    // Vector from vehicle to traffic condition
    const toTrafficX = trafficPos.x - vehiclePos.x;
    const toTrafficY = trafficPos.y - vehiclePos.y;

    // Project traffic position onto vehicle's direction vector
    const projection = toTrafficX * normDirX + toTrafficY * normDirY;

    // Check if traffic is ahead of vehicle (positive projection) and within a lookahead distance
    const lookAheadDistance = 150; // Customizable lookahead distance
    if (projection <= 0 || projection > lookAheadDistance) return false;

    // Calculate perpendicular distance from path
    const perpDistance = Math.abs(toTrafficX * (-normDirY) + toTrafficY * normDirX);

    // Check if traffic is within a certain "path width" considering its affectedRadius and a vehicle width
    const vehicleWidth = 20; // Assume vehicle width for path consideration
    const pathWidth = (vehicleWidth / 2) + trafficCondition.affectedRadius;
    
    if (perpDistance <= pathWidth) {
      if (trafficCondition.severity === 'high') {
        vehicle.lastDecision = 'HIGH_TRAFFIC';
        this.addLog(vehicle.id, 'HIGH_TRAFFIC', 'High traffic zone detected', vehicle.position);
      } else {
        vehicle.lastDecision = 'TRAFFIC_ACCUMULATION';
        this.addLog(vehicle.id, 'TRAFFIC_ACCUMULATION', 'Traffic encountered', vehicle.position);
      }
      return true;
    }
    
    return false;
  }

  // Enhanced rerouting logic
  private shouldRerouteVehicle(
    vehicle: Vehicle, 
    traffic: TrafficCondition[], 
    pedestrians: Pedestrian[]
  ): boolean {
    // If in low battery mode, do not reroute for any other reason
    if (vehicle.lowBatteryMode) {
      return false;
    }
    // Critical battery rerouting
    if (vehicle.parameters.batteryPercentage < 15) {
      this.addLog(vehicle.id, 'BATTERY_LOW_REROUTE', 'Rerouting: Critical battery level', vehicle.position);
      return true;
    }

    // Severe tire pressure issues
    if (vehicle.parameters.tirePressure < 75) {
      this.addLog(vehicle.id, 'TIRE_PRESSURE_REROUTE', 'Rerouting: Low tire pressure detected', vehicle.position);
      return true;
    }

    // NEW: Explicit check for high traffic directly in path (avoidance)
    for (const trafficCondition of traffic) {
        if (trafficCondition.severity === 'high' && this.isTrafficInPath(vehicle, trafficCondition)) {
            this.addLog(vehicle.id, 'HIGH_TRAFFIC_AVOID', 'Rerouting: High traffic zone detected directly in path. Avoiding.', vehicle.position);
            return true;
        }
    }

    // Check for high traffic in upcoming route segments
    let highTrafficAhead = 0;
    const lookAheadSegments = Math.min(5, vehicle.route.length - vehicle.currentRouteIndex - 1);
    
    for (let i = 1; i <= lookAheadSegments; i++) {
      const routePoint = vehicle.route[vehicle.currentRouteIndex + i];
      
      for (const trafficCondition of traffic) {
        const distance = this.getDistance(routePoint, trafficCondition.position);
        if (distance <= trafficCondition.affectedRadius) {
          if (trafficCondition.severity === 'high') {
            highTrafficAhead += 3;
          } else if (trafficCondition.severity === 'medium') {
            highTrafficAhead += 1;
          }
        }
      }
    }

    // Reroute if significant traffic ahead
    if (highTrafficAhead >= 4) {
      this.addLog(vehicle.id, 'TRAFFIC_ACCUMULATION_REROUTE', 'Rerouting: Significant traffic accumulation ahead', vehicle.position);
      return true;
    }

    // Check for any blocking pedestrian ahead (reroute if any, not just 2+)
    for (let i = 1; i <= Math.min(3, vehicle.route.length - vehicle.currentRouteIndex - 1); i++) {
      const routePoint = vehicle.route[vehicle.currentRouteIndex + i];
      for (const pedestrian of pedestrians) {
        if (pedestrian.isBlocking && this.getDistance(routePoint, pedestrian.position) < 30) {
          this.addLog(vehicle.id, 'PEDESTRIAN_BLOCKING_REROUTE', 'Rerouting: Pedestrian blocking ahead', vehicle.position);
          return true;
        }
      }
    }

    // In city mode, reroute if any upcoming route point is inside a building
    if (this.mapType === 'city') {
      for (let i = vehicle.currentRouteIndex + 1; i < vehicle.route.length; i++) {
        const point = vehicle.route[i];
        if (PathfindingEngine.isInAnyBuilding(point.x, point.y, 10)) {
          this.addLog(vehicle.id, 'HIGH_TRAFFIC_AVOID', 'Rerouting: Building (red traffic) in path. Avoiding.', vehicle.position);
          const finalDestination = vehicle.route[vehicle.route.length - 1];
          const newRoute = this.pathfinder.findPath(
            vehicle.position,
            finalDestination,
            traffic,
            pedestrians,
            vehicle.parameters,
            this.mapType
          );
          if (newRoute && newRoute.length > 1) {
            vehicle.route = newRoute;
            vehicle.currentRouteIndex = 0;
          } else {
            vehicle.isMoving = false;
            vehicle.lastDecision = 'Destination unreachable (building)';
            return false;
          }
          break;
        }
      }
    }

    return false;
  }

  // Helper: check if the segment from 'from' to 'to' crosses a building
  private segmentCrossesBuilding(from: Position, to: Position): boolean {
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      if (PathfindingEngine.isInAnyBuilding(x, y, 10)) {
        return true;
      }
    }
    return false;
  }

  // Helper: check if the segment from 'from' to 'to' crosses a storage unit
  private segmentCrossesStorageUnit(from: Position, to: Position): boolean {
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      if (this.mapType === 'warehouse') {
        if (isInAnyStorageUnit(x, y, 5)) {
          return true;
        }
      }
    }
    return false;
  }

  // Helper: predict a vehicle's position after a given time (in ms) along its route
  private predictVehiclePosition(vehicle: Vehicle, timeMs: number): Position {
    if (vehicle.route.length < 2 || vehicle.currentRouteIndex >= vehicle.route.length - 1) {
      return vehicle.position;
    }
    let idx = vehicle.currentRouteIndex;
    let pos = { ...vehicle.position };
    let remainingTime = timeMs / 1000; // convert ms to seconds
    const speed = vehicle.parameters.speed;
    while (idx < vehicle.route.length - 1 && remainingTime > 0) {
      const nextWp = vehicle.route[idx + 1];
      const dist = this.getDistance(pos, nextWp);
      const timeToNext = dist / (speed || 1e-6);
      if (remainingTime < timeToNext) {
        const ratio = remainingTime / timeToNext;
        pos = {
          x: pos.x + (nextWp.x - pos.x) * ratio,
          y: pos.y + (nextWp.y - pos.y) * ratio
        };
        break;
      } else {
        pos = { ...nextWp };
        idx++;
        remainingTime -= timeToNext;
      }
    }
    return pos;
  }

  // Helper: minimum distance between two line segments (p1-p2 and q1-q2)
  private static minDistBetweenSegments(p1: Position, p2: Position, q1: Position, q2: Position): number {
    // Helper to compute squared distance between two points
    function dist2(a: Position, b: Position) {
      return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    }
    // Compute closest points between two segments
    const u = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v = { x: q2.x - q1.x, y: q2.y - q1.y };
    const w0 = { x: p1.x - q1.x, y: p1.y - q1.y };
    const a = u.x * u.x + u.y * u.y;
    const b = u.x * v.x + u.y * v.y;
    const c = v.x * v.x + v.y * v.y;
    const d = u.x * w0.x + u.y * w0.y;
    const e = v.x * w0.x + v.y * w0.y;
    const D = a * c - b * b;
    let sN, sD = D;
    let tN, tD = D;
    if (D < 1e-8) {
      sN = 0.0;
      sD = 1.0;
      tN = e;
      tD = c;
    } else {
      sN = (b * e - c * d);
      tN = (a * e - b * d);
      if (sN < 0) {
        sN = 0;
        tN = e;
        tD = c;
      } else if (sN > sD) {
        sN = sD;
        tN = e + b;
        tD = c;
      }
    }
    if (tN < 0) {
      tN = 0;
      if (-d < 0) sN = 0;
      else if (-d > a) sN = sD;
      else { sN = -d; sD = a; }
    } else if (tN > tD) {
      tN = tD;
      if ((-d + b) < 0) sN = 0;
      else if ((-d + b) > a) sN = sD;
      else { sN = (-d + b); sD = a; }
    }
    const sc = Math.abs(sN) < 1e-8 ? 0.0 : sN / sD;
    const tc = Math.abs(tN) < 1e-8 ? 0.0 : tN / tD;
    const cp1 = { x: p1.x + sc * u.x, y: p1.y + sc * u.y };
    const cp2 = { x: q1.x + tc * v.x, y: q1.y + tc * v.y };
    return Math.sqrt(dist2(cp1, cp2));
  }

  // Helper: find the nearest safe point at least minDist away from any storage unit, and as far as possible from the edge
  private findNearestSafePoint(x: number, y: number, minDist: number = 8): { x: number, y: number } {
    if (!isInAnyStorageUnit(x, y, minDist + 2)) return { x, y };
    // Spiral search outwards, higher resolution
    const maxRadius = 60;
    let best = null;
    let bestDist = -1;
    for (let r = minDist + 2; r <= maxRadius; r += 1) {
      for (let angle = 0; angle < 360; angle += 5) {
        const rad = angle * Math.PI / 180;
        const nx = x + r * Math.cos(rad);
        const ny = y + r * Math.sin(rad);
        if (nx >= 0 && nx < 800 && ny >= 0 && ny < 600 && !isInAnyStorageUnit(nx, ny, minDist + 2)) {
          // Find the minimum distance to any storage unit edge
          let minEdgeDist = Infinity;
          for (const unit of warehouseStorageUnits) {
            const dx = Math.max(unit.x - nx, 0, nx - (unit.x + unit.width));
            const dy = Math.max(unit.y - ny, 0, ny - (unit.y + unit.height));
            minEdgeDist = Math.min(minEdgeDist, Math.sqrt(dx * dx + dy * dy));
          }
          if (minEdgeDist > bestDist) {
            bestDist = minEdgeDist;
            best = { x: nx, y: ny };
          }
        }
      }
    }
    // Fallback: just return the best found, or original
    return best || { x, y };
  }

  // Helper: generate a detour path around the nearest storage unit boundary
  private detourAroundStorageUnit(from: Position, to: Position, minDist: number = 8): Position[] {
    // Find the nearest storage unit the segment crosses
    let nearestUnit = null;
    let minDistToUnit = Infinity;
    for (const unit of warehouseStorageUnits) {
      // Check if the segment crosses this unit
      const unitRect = {
        x: unit.x - minDist,
        y: unit.y - minDist,
        width: unit.width + 2 * minDist,
        height: unit.height + 2 * minDist
      };
      // Simple AABB check for intersection
      const crosses = (
        Math.min(from.x, to.x) <= unitRect.x + unitRect.width &&
        Math.max(from.x, to.x) >= unitRect.x &&
        Math.min(from.y, to.y) <= unitRect.y + unitRect.height &&
        Math.max(from.y, to.y) >= unitRect.y
      );
      if (crosses) {
        // Use center of the unit for distance
        const center = { x: unit.x + unit.width / 2, y: unit.y + unit.height / 2 };
        const dist = Math.min(this.getDistance(from, center), this.getDistance(to, center));
        if (dist < minDistToUnit) {
          minDistToUnit = dist;
          nearestUnit = unitRect;
        }
      }
    }
    if (!nearestUnit) return [];
    // Find the closest entry and exit points on the boundary
    const corners = [
      { x: nearestUnit.x, y: nearestUnit.y },
      { x: nearestUnit.x + nearestUnit.width, y: nearestUnit.y },
      { x: nearestUnit.x + nearestUnit.width, y: nearestUnit.y + nearestUnit.height },
      { x: nearestUnit.x, y: nearestUnit.y + nearestUnit.height }
    ];
    // Find the closest corner to 'from' and to 'to'
    let entry = corners[0], exit = corners[0], minEntry = Infinity, minExit = Infinity;
    for (const c of corners) {
      const dEntry = this.getDistance(from, c);
      const dExit = this.getDistance(to, c);
      if (dEntry < minEntry) { minEntry = dEntry; entry = c; }
      if (dExit < minExit) { minExit = dExit; exit = c; }
    }
    // Go from 'from' to entry, then around the boundary to exit, then to 'to'
    // Choose the shorter direction (clockwise or counterclockwise)
    const entryIdx = corners.findIndex(c => c.x === entry.x && c.y === entry.y);
    const exitIdx = corners.findIndex(c => c.x === exit.x && c.y === exit.y);
    const path1: Position[] = [];
    for (let i = entryIdx; i !== exitIdx; i = (i + 1) % 4) path1.push(corners[i]);
    path1.push(corners[exitIdx]);
    const path2: Position[] = [];
    for (let i = entryIdx; i !== exitIdx; i = (i + 3) % 4) path2.push(corners[i]);
    path2.push(corners[exitIdx]);
    // Choose the shorter path
    const dist1 = path1.reduce((acc, p, i) => i > 0 ? acc + this.getDistance(path1[i - 1], p) : 0, this.getDistance(from, entry));
    const dist2 = path2.reduce((acc, p, i) => i > 0 ? acc + this.getDistance(path2[i - 1], p) : 0, this.getDistance(from, entry));
    const boundaryPath = (dist1 < dist2 ? path1 : path2);
    return [from, entry, ...boundaryPath, exit, to];
  }

  // Update vehicle position and parameters
  public updateVehicle(
    vehicle: Vehicle,
    traffic: TrafficCondition[],
    pedestrians: Pedestrian[],
    deltaTime: number,
    allVehicles?: Vehicle[],
    selectedVehicleIndex?: number,
    vehicleIndex?: number
  ): Vehicle {
    const updatedVehicle = { ...vehicle };

    // Obstacle detection: pedestrian, car, or traffic zone
    let obstacleDetected = false;
    let randomObstacleSpeed = 30;
    // Enhanced pedestrian blocking logic
    const pedestrianBlock = this.checkPedestrianBlocking(vehicle, pedestrians);
    if (pedestrianBlock.status === 'stop') {
      updatedVehicle.isMoving = false;
      updatedVehicle.parameters.speed = 0;
      updatedVehicle.lastDecision = 'Stopped for pedestrian (very close)';
      this.addLog(vehicle.id, 'PEDESTRIAN_STOP', `Stopped for pedestrian (within 10 units), speed: 0`, vehicle.position);
      return updatedVehicle;
    } else if (pedestrianBlock.status === 'slow') {
      // Just slow down for pedestrian, do not reroute segment
      obstacleDetected = true;
      randomObstacleSpeed = 8 + Math.random() * 4; // Slow speed
      updatedVehicle.parameters.speed = randomObstacleSpeed;
      updatedVehicle.lastDecision = `Slowing down for pedestrian (speed: ${randomObstacleSpeed.toFixed(1)})`;
      this.addLog(vehicle.id, 'PEDESTRIAN_SLOW', `Slowing down for pedestrian (within detection range), speed: ${randomObstacleSpeed.toFixed(1)}`, vehicle.position);
    } else if (pedestrianBlock.status === 'detected') {
      updatedVehicle.lastDecision = 'Pedestrian detected ahead';
      // No speed change, but log detection
      this.addLog(vehicle.id, 'PEDESTRIAN_DETECTED', `Pedestrian detected ahead (far), speed: ${updatedVehicle.parameters.speed.toFixed(1)}`, vehicle.position);
    }
    // Check for car ahead (city mode, av-001 only)
    if (
      this.mapType === 'city' &&
      typeof allVehicles !== 'undefined' &&
      typeof selectedVehicleIndex === 'number' &&
      typeof vehicleIndex === 'number' &&
      vehicleIndex === selectedVehicleIndex
    ) {
      const pedestrianRadius = 8;
      const detectionDistance = pedestrianRadius * 10;
      const currentPos = vehicle.position;
      if (vehicle.currentRouteIndex < vehicle.route.length - 1) {
        const nextPos = vehicle.route[vehicle.currentRouteIndex + 1];
        const direction = {
          x: nextPos.x - currentPos.x,
          y: nextPos.y - currentPos.y
        };
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (length > 0) {
          const normalizedDir = {
            x: direction.x / length,
            y: direction.y / length
          };
          for (let j = 0; j < allVehicles.length; j++) {
            if (j === vehicleIndex) continue;
            const other = allVehicles[j];
            const toOther = {
              x: other.position.x - currentPos.x,
              y: other.position.y - currentPos.y
            };
            const distance = Math.sqrt(toOther.x * toOther.x + toOther.y * toOther.y);
            const dotProduct = toOther.x * normalizedDir.x + toOther.y * normalizedDir.y;
            if (dotProduct <= 0) continue;
            const lateralDistance = Math.abs(
              toOther.x * normalizedDir.y - toOther.y * normalizedDir.x
            );
            if (lateralDistance < 15 && distance < detectionDistance) {
              obstacleDetected = true;
            }
          }
        }
      }
    }
    // Check for any traffic zone
    for (const trafficCondition of traffic) {
      const distance = this.getDistance(vehicle.position, trafficCondition.position);
      if (distance <= trafficCondition.affectedRadius) {
        obstacleDetected = true;
      }
    }
    // If any obstacle detected, set speed randomly between 15 and 25
    if (obstacleDetected) {
      randomObstacleSpeed = 15 + Math.random() * 10;
      updatedVehicle.parameters.speed = randomObstacleSpeed;
      updatedVehicle.lastDecision = `Slowing down for obstacle (speed: ${randomObstacleSpeed.toFixed(1)})`;
      this.addLog(vehicle.id, 'OBSTACLE_SLOW', `Slowing down for obstacle, speed: ${randomObstacleSpeed.toFixed(1)}`, vehicle.position);
    }

    // Enhanced rerouting check
    const shouldReroute = this.shouldRerouteVehicle(vehicle, traffic, pedestrians);
    
    if (shouldReroute) {
      // Build a new route that goes through all remaining waypoints
      const remainingWaypoints = vehicle.route.slice(vehicle.currentRouteIndex + 1);
      let newRoute: Position[] = [];
      let from = vehicle.position;
      for (let i = 0; i < remainingWaypoints.length; i++) {
        let to = remainingWaypoints[i];
        let segment = null;
        if (this.mapType === 'warehouse') {
          segment = this.pathfinder.findPath(from, to, traffic, pedestrians, vehicle.parameters, this.mapType);
          if (!segment || segment.length <= 1) {
            // If direct path fails, try to detour around the storage unit
            const detourPath = this.detourAroundStorageUnit(from, to, 8);
            if (detourPath.length > 2) {
              // Try to smooth and use the detour path
              segment = detourPath;
              this.addLog(vehicle.id, 'REROUTE_DETOUR', 'Detoured around storage unit boundary.', vehicle.position);
            } else {
              // If still not possible, try nearest safe point
              const safe = this.findNearestSafePoint(to.x, to.y, 8);
              segment = this.pathfinder.findPath(from, safe, traffic, pedestrians, vehicle.parameters, this.mapType);
              if (segment && segment.length > 1) {
                this.addLog(vehicle.id, 'REROUTE_SAFE_POINT', 'Rerouted to nearest safe point around obstacle.', vehicle.position);
                to = safe;
              } else {
                // If still not possible, just continue to next waypoint
                this.addLog(vehicle.id, 'SKIPPED_WAYPOINT', 'Skipped unreachable waypoint during reroute.', vehicle.position);
                continue;
              }
            }
          }
        } else {
          segment = this.pathfinder.findPath(from, to, traffic, pedestrians, vehicle.parameters, this.mapType);
        }
        if (segment && segment.length > 1) {
          if (newRoute.length > 0) {
            newRoute = newRoute.concat(segment.slice(1));
          } else {
            newRoute = newRoute.concat(segment);
          }
          from = to;
        }
      }
      if (newRoute.length <= 1) {
        // If no alternative path found, just keep the vehicle moving in place (do not stop)
        this.addLog(vehicle.id, 'UNREACHABLE_DESTINATION', 'Could not find a path to any waypoint during reroute. Vehicle will keep trying.', vehicle.position);
        updatedVehicle.isMoving = true;
        updatedVehicle.lastDecision = 'No valid reroute found, will keep trying.';
        // Do not return early, let the vehicle keep trying in the next update
      } else {
        updatedVehicle.route = newRoute;
        updatedVehicle.currentRouteIndex = 0;
      }
      // More specific rerouting reasons
      if (vehicle.parameters.batteryPercentage < 15) {
        updatedVehicle.lastDecision = 'Emergency reroute: Critical battery level';
        this.addLog(vehicle.id, 'BATTERY_LOW', updatedVehicle.lastDecision, vehicle.position);
      } else if (vehicle.parameters.tirePressure < 75) {
        updatedVehicle.lastDecision = 'Reroute: Low tire pressure detected';
        this.addLog(vehicle.id, 'TIRE_PRESSURE', updatedVehicle.lastDecision, vehicle.position);
      } else {
        updatedVehicle.lastDecision = 'Rerouted due to traffic/pedestrian conditions';
        this.addLog(vehicle.id, 'REROUTE', updatedVehicle.lastDecision, vehicle.position);
      }
    }

    // Proactive reroute if any of the next 5 waypoints are inside a building
    if ((this.mapType === 'city') && vehicle.currentRouteIndex < vehicle.route.length - 1) {
      const lookahead = 5;
      let rerouteNeeded = false;
      for (let i = 1; i <= lookahead && vehicle.currentRouteIndex + i < vehicle.route.length; i++) {
        const wp = vehicle.route[vehicle.currentRouteIndex + i];
        if (PathfindingEngine.isInAnyBuilding(wp.x, wp.y, 10)) {
          rerouteNeeded = true;
          break;
        }
      }
      if (rerouteNeeded) {
        this.addLog(vehicle.id, 'HIGH_TRAFFIC_AVOID', 'Rerouting: Building detected ahead in path.', vehicle.position);
        // Reroute through all remaining waypoints
        const remainingWaypoints = vehicle.route.slice(vehicle.currentRouteIndex + 1);
        let newRoute: Position[] = [];
        let from = vehicle.position;
        for (let i = 0; i < remainingWaypoints.length; i++) {
          let to = remainingWaypoints[i];
          if (this.mapType === 'warehouse') to = this.findNearestSafePoint(to.x, to.y, 8);
          const segment = this.pathfinder.findPath(
            from,
            to,
            traffic,
            pedestrians,
            vehicle.parameters,
            this.mapType
          );
          if (segment && segment.length > 1) {
            if (newRoute.length > 0) {
              newRoute = newRoute.concat(segment.slice(1));
            } else {
              newRoute = newRoute.concat(segment);
            }
            from = to;
          } else {
            updatedVehicle.isMoving = false;
            updatedVehicle.lastDecision = 'Destination unreachable (building)';
            return updatedVehicle;
          }
        }
        if (newRoute.length > 1) {
          updatedVehicle.route = newRoute;
          updatedVehicle.currentRouteIndex = 0;
        } else {
          updatedVehicle.isMoving = false;
          updatedVehicle.lastDecision = 'Destination unreachable (building)';
          return updatedVehicle;
        }
      }
    }

    // Collision avoidance for main car only (robust segment-based prediction)
    if (
      typeof allVehicles !== 'undefined' &&
      typeof selectedVehicleIndex === 'number' &&
      typeof vehicleIndex === 'number' &&
      vehicleIndex === selectedVehicleIndex
    ) {
      const LOOKAHEAD_TIME = 2000; // ms
      const TIME_STEP = 100; // ms
      const COLLISION_THRESHOLD = 30;
      let collisionDetected = false;
      let prevMain = vehicle.position;
      const prevOthers = allVehicles.map(v => v.position);
      for (let t = TIME_STEP; t <= LOOKAHEAD_TIME; t += TIME_STEP) {
        const mainPredicted = this.predictVehiclePosition(vehicle, t);
        for (let j = 0; j < allVehicles.length; j++) {
          if (j === vehicleIndex) continue;
          const other = allVehicles[j];
          const otherPredicted = this.predictVehiclePosition(other, t);
          // Check segment-to-segment distance
          const minDist = SimulationEngine.minDistBetweenSegments(prevMain, mainPredicted, prevOthers[j], otherPredicted);
          if (minDist < COLLISION_THRESHOLD) {
            collisionDetected = true;
            break;
          }
          prevOthers[j] = otherPredicted;
        }
        if (collisionDetected) break;
        prevMain = mainPredicted;
      }
      if (collisionDetected) {
        this.addLog(vehicle.id, 'COLLISION_AVOID', 'Rerouting: Predicted collision course with another car (segment overlap).', vehicle.position);
        const remainingWaypoints = vehicle.route.slice(vehicle.currentRouteIndex + 1);
        let newRoute: Position[] = [];
        let from = vehicle.position;
        for (let i = 0; i < remainingWaypoints.length; i++) {
          let to = remainingWaypoints[i];
          if (this.mapType === 'warehouse') to = this.findNearestSafePoint(to.x, to.y, 8);
          const segment = this.pathfinder.findPath(
            from,
            to,
            traffic,
            pedestrians,
            vehicle.parameters,
            this.mapType
          );
          if (segment && segment.length > 1) {
            if (newRoute.length > 0) {
              newRoute = newRoute.concat(segment.slice(1));
            } else {
              newRoute = newRoute.concat(segment);
            }
            from = to;
          } else {
            updatedVehicle.isMoving = false;
            updatedVehicle.lastDecision = 'Destination unreachable (collision risk)';
            return updatedVehicle;
          }
        }
        if (newRoute.length > 1) {
          updatedVehicle.route = newRoute;
          updatedVehicle.currentRouteIndex = 0;
        } else {
          updatedVehicle.isMoving = false;
          updatedVehicle.lastDecision = 'Destination unreachable (collision risk)';
          return updatedVehicle;
        }
      }
    }

    // Move vehicle along route
    if (vehicle.currentRouteIndex < vehicle.route.length - 1) {
      updatedVehicle.isMoving = true;
      const targetPosition = vehicle.route[vehicle.currentRouteIndex + 1];
      // Use the random speed if obstacle detected, else use normal speed
      const adjustedSpeed = obstacleDetected ? updatedVehicle.parameters.speed : vehicle.parameters.speed;
      updatedVehicle.parameters.speed = adjustedSpeed;
      const moveDistance = adjustedSpeed * deltaTime / 1000;
      const nextPosition = this.moveToward(vehicle.position, targetPosition, moveDistance);
      // Prevent entering buildings: check the segment
      if (
        this.mapType === 'city' &&
        this.segmentCrossesBuilding(vehicle.position, nextPosition)
      ) {
        this.addLog(vehicle.id, 'HIGH_TRAFFIC_AVOID', 'Rerouting: Path to next waypoint would enter building.', vehicle.position);
        // Reroute through all remaining waypoints
        const remainingWaypoints = vehicle.route.slice(vehicle.currentRouteIndex + 1);
        let newRoute: Position[] = [];
        let from = vehicle.position;
        for (let i = 0; i < remainingWaypoints.length; i++) {
          let to = remainingWaypoints[i];
          if (this.mapType === 'warehouse') to = this.findNearestSafePoint(to.x, to.y, 8);
          const segment = this.pathfinder.findPath(
            from,
            to,
            traffic,
            pedestrians,
            vehicle.parameters,
            this.mapType
          );
          if (segment && segment.length > 1) {
            if (newRoute.length > 0) {
              newRoute = newRoute.concat(segment.slice(1));
            } else {
              newRoute = newRoute.concat(segment);
            }
            from = to;
          } else {
            updatedVehicle.isMoving = false;
            updatedVehicle.lastDecision = 'Destination unreachable (building)';
            return updatedVehicle;
          }
        }
        if (newRoute.length > 1) {
          updatedVehicle.route = newRoute;
          updatedVehicle.currentRouteIndex = 0;
        } else {
          updatedVehicle.isMoving = false;
          updatedVehicle.lastDecision = 'Destination unreachable (building)';
          return updatedVehicle;
        }
      } else if (
        this.mapType === 'warehouse' &&
        this.segmentCrossesStorageUnit(vehicle.position, nextPosition)
      ) {
        // Only log and reroute once for the same unreachable waypoint
        if (vehicle.lastDecision !== 'Destination unreachable (storage unit)') {
          this.addLog(vehicle.id, 'STORAGE_UNIT_AVOID', 'Rerouting: Path to next waypoint would enter storage unit.', vehicle.position);
        }
        updatedVehicle.isMoving = false;
        updatedVehicle.lastDecision = 'Destination unreachable (storage unit)';
        return updatedVehicle;
      } else {
        updatedVehicle.position = nextPosition;
        updatedVehicle.totalDistance += moveDistance;
      }
      // Check if reached next waypoint
      const distanceToTarget = this.getDistance(updatedVehicle.position, targetPosition);
      if (distanceToTarget < 1) {
        updatedVehicle.currentRouteIndex++;
        updatedVehicle.lastDecision = `Reached waypoint ${updatedVehicle.currentRouteIndex}`;
      }
    } else {
      updatedVehicle.isMoving = false;
      updatedVehicle.parameters.speed = 0;
      // Only log and trigger callback if the vehicle was previously moving
      if (vehicle.isMoving) {
        updatedVehicle.lastDecision = 'Destination reached';
        this.addLog(vehicle.id, 'DESTINATION_REACHED', `Destination reached, speed: 0`, vehicle.position);
        if (this._onDestinationReached) {
          this._onDestinationReached(vehicle.id);
        }
      }
    }
    return updatedVehicle;
  }

  // Update vehicle parameters based on movement and conditions
  private updateVehicleParameters(
    params: VehicleParameters, 
    distanceMoved: number, 
    traffic: TrafficCondition[], 
    position: Position
  ): VehicleParameters {
    const updated = { ...params };

    // Update mileage
    updated.mileage += distanceMoved / 1000; // Convert to km

    // Update battery/fuel consumption
    let consumptionRate = params.fuelConsumptionPerBlock;
    
    // Increase consumption in traffic
    for (const trafficCondition of traffic) {
      const distance = this.getDistance(position, trafficCondition.position);
      if (distance <= trafficCondition.affectedRadius) {
        const multiplier = trafficCondition.severity === 'high' ? 1.8 : 
                          trafficCondition.severity === 'medium' ? 1.4 : 1.1;
        consumptionRate *= multiplier;
      }
    }

    updated.batteryPercentage = Math.max(0, updated.batteryPercentage - (consumptionRate * distanceMoved / 100));

    // More realistic tire pressure decrease
    const pressureDecrease = (Math.random() * 0.05) + (distanceMoved / 10000);
    updated.tirePressure = Math.max(60, updated.tirePressure - pressureDecrease);

    // Dynamic speed adjustment based on conditions
    if (updated.batteryPercentage < 15) {
      updated.speed = Math.max(10, params.initialSpeed * 0.5);
    } else if (updated.batteryPercentage < 30) {
      updated.speed = Math.max(15, params.initialSpeed * 0.7);
    } else if (updated.tirePressure < 75) {
      updated.speed = Math.max(20, params.initialSpeed * 0.8);
    } else if (updated.tirePressure < 85) {
      updated.speed = Math.max(25, params.initialSpeed * 0.9);
    } else {
      updated.speed = params.initialSpeed;
    }

    return updated;
  }

  // Utility functions
  private getDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }

  private getDirection(from: Position, to: Position): Position {
    const distance = this.getDistance(from, to);
    if (distance === 0) return { x: 0, y: 0 };
    
    return {
      x: (to.x - from.x) / distance,
      y: (to.y - from.y) / distance
    };
  }

  private moveToward(from: Position, to: Position, maxDistance: number): Position {
    const distance = this.getDistance(from, to);
    if (distance <= maxDistance) return to;

    const direction = this.getDirection(from, to);
    return {
      x: from.x + direction.x * maxDistance,
      y: from.y + direction.y * maxDistance
    };
  }

  // Update pedestrians with more realistic movement
  public updatePedestrians(pedestrians: Pedestrian[], deltaTime: number): Pedestrian[] {
    return pedestrians.map(pedestrian => {
      const moveDistance = pedestrian.speed * deltaTime / 1000;
      const newPosition = this.moveToward(pedestrian.position, pedestrian.destination, moveDistance);
      
      // If reached destination, set new random destination
      let destination = pedestrian.destination;
      if (this.getDistance(newPosition, pedestrian.destination) < 10) {
        destination = {
          x: Math.random() * 800,
          y: Math.random() * 600
        };
      }

      return {
        ...pedestrian,
        position: newPosition,
        destination,
        isBlocking: true // Always keep pedestrians blocking
      };
    });
  }

  // Add log entry
  private addLog(vehicleId: string, event: string, details: string, position: Position): void {
    this.logs.push({
      timestamp: Date.now(),
      vehicleId,
      event,
      details,
      position
    });

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  // Get recent logs
  public getLogs(): LogEntry[] {
    return [...this.logs].reverse();
  }

  // Add a constant for the charge station position
  private CHARGE_STATION = { x: 760, y: 560 };

  // In the method that handles 'Drain Fuel', update the vehicle's route to only the charge station and reroute
  // Find the method that sets lowBatteryMode or handles battery drain
  // Example patch for a drainFuel method or similar:
  public drainFuel(vehicle: Vehicle, traffic: TrafficCondition[], pedestrians: Pedestrian[]): Vehicle {
    const updatedVehicle = { ...vehicle };
    updatedVehicle.parameters.batteryPercentage = Math.floor(Math.random() * 10) + 1;
    updatedVehicle.lowBatteryMode = true;
    // Set route to only the charge station
    updatedVehicle.route = [vehicle.position, this.CHARGE_STATION];
    updatedVehicle.currentRouteIndex = 0;
    // Reroute to the charge station using all normal rules
    const segment = this.pathfinder.findPath(
      vehicle.position,
      this.CHARGE_STATION,
      traffic,
      pedestrians,
      vehicle.parameters,
      this.mapType
    );
    if (segment && segment.length > 1) {
      updatedVehicle.route = segment;
      updatedVehicle.currentRouteIndex = 0;
      updatedVehicle.isMoving = true;
      updatedVehicle.lastDecision = 'Low battery: rerouting to charge station';
      this.addLog(vehicle.id, 'BATTERY_LOW_REROUTE', 'Rerouting to charge station at bottom right', vehicle.position);
    } else {
      updatedVehicle.isMoving = false;
      updatedVehicle.lastDecision = 'Charge station unreachable';
      this.addLog(vehicle.id, 'BATTERY_LOW_REROUTE', 'Charge station unreachable', vehicle.position);
    }
    return updatedVehicle;
  }
}