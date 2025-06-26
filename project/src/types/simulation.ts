export interface Position {
  x: number;
  y: number;
}

export interface VehicleParameters {
  batteryPercentage: number;
  fuelConsumptionPerBlock: number;
  tirePressure: number;
  speed: number;
  initialSpeed: number;
  mileage: number;
  maxBatteryCapacity: number;
  maxFuelCapacity: number;
}

export interface Vehicle {
  id: string;
  position: Position;
  parameters: VehicleParameters;
  route: Position[];
  currentRouteIndex: number;
  isMoving: boolean;
  lastDecision: string;
  totalDistance: number;
  lowBatteryMode?: boolean;
}

export interface TrafficCondition {
  position: Position;
  severity: 'low' | 'medium' | 'high';
  affectedRadius: number;
}

export interface Pedestrian {
  id: string;
  position: Position;
  destination: Position;
  speed: number;
  isBlocking: boolean;
}

export interface SimulationState {
  vehicles: Vehicle[];
  traffic: TrafficCondition[];
  pedestrians: Pedestrian[];
  isRunning: boolean;
  simulationSpeed: number;
  currentTime: number;
}

export interface PathNode {
  position: Position;
  gCost: number;
  hCost: number;
  fCost: number;
  parent: PathNode | null;
}

export interface LogEntry {
  timestamp: number;
  vehicleId: string;
  event: string;
  details: string;
  position: Position;
}