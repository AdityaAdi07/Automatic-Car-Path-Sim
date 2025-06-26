export interface Vehicle {
  id: string;
  position: { x: number; y: number };
  route: { x: number; y: number }[];
  currentRouteIndex: number;
  isMoving: boolean;
  lastDecision: string;
  parameters: {
    speed: number;
    initialSpeed: number;
    batteryPercentage: number;
  };
  lowBatteryMode?: boolean;
} 