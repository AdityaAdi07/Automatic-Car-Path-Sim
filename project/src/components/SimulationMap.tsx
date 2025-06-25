import React from 'react';
import { Vehicle, TrafficCondition, Pedestrian, Position } from '../types/simulation';
import * as Icons from 'lucide-react';
import { VehicleHUD } from './VehicleHUD';

interface SimulationMapProps {
  vehicles: Vehicle[];
  traffic: TrafficCondition[];
  pedestrians: Pedestrian[];
  onMapClick: (position: Position) => void;
  mapType: 'warehouse' | 'city';
  selectedVehicleIndex?: number;
}

export const SimulationMap: React.FC<SimulationMapProps> = ({
  vehicles,
  traffic,
  pedestrians,
  onMapClick,
  mapType,
  selectedVehicleIndex = 0
}) => {
  const handleMapClick = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    onMapClick({ x, y });
  };

  const getTrafficColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getBatteryColor = (percentage: number) => {
    if (percentage > 60) return '#10B981';
    if (percentage > 30) return '#F59E0B';
    return '#EF4444';
  };

  // Calculate vehicle rotation based on movement direction
  const getVehicleRotation = (vehicle: Vehicle) => {
    // If the vehicle is not moving or has no next waypoint, maintain current orientation or default
    if (!vehicle.isMoving || vehicle.route.length <= vehicle.currentRouteIndex + 1) {
      return 0; // Or vehicle.currentRotation if we tracked it
    }
    
    const current = vehicle.position;
    const target = vehicle.route[vehicle.currentRouteIndex + 1];
    const angle = Math.atan2(target.y - current.y, target.x - current.x) * 180 / Math.PI;
    return angle + 90; // Adjust for car icon orientation
  };

  // Check if pedestrian is in vehicle's path (forward detection cone)
  const isPedestrianInPath = (vehicle: Vehicle, pedestrian: Pedestrian) => {
    if (!vehicle.isMoving || vehicle.currentRouteIndex >= vehicle.route.length - 1) {
      return false;
    }

    const vehiclePos = vehicle.position;
    const targetPos = vehicle.route[vehicle.currentRouteIndex + 1];
    const pedPos = pedestrian.position;

    // Calculate direction vector from vehicle to target
    const dirX = targetPos.x - vehiclePos.x;
    const dirY = targetPos.y - vehiclePos.y;
    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
    
    if (dirLength === 0) return false;

    // Normalize direction vector
    const normDirX = dirX / dirLength;
    const normDirY = dirY / dirLength;

    // Vector from vehicle to pedestrian
    const toPedX = pedPos.x - vehiclePos.x;
    const toPedY = pedPos.y - vehiclePos.y;

    // Project pedestrian position onto vehicle's direction vector
    const projection = toPedX * normDirX + toPedY * normDirY;

    // Check if pedestrian is ahead of vehicle (positive projection)
    if (projection <= 0) return false;

    // Check if pedestrian is within detection range (ahead of vehicle)
    if (projection > 100) return false; // 100 pixel detection range

    // Calculate perpendicular distance from path
    const perpDistance = Math.abs(toPedX * (-normDirY) + toPedY * normDirX);

    // Check if pedestrian is within path width (30 pixels on each side)
    return perpDistance <= 30;
  };

  // Define city buildings as obstacles (rectangles)
  const cityBuildings = [
    { x: 150, y: 150, width: 120, height: 200 },
    { x: 400, y: 100, width: 180, height: 120 },
    { x: 600, y: 300, width: 120, height: 200 },
    { x: 250, y: 400, width: 200, height: 120 },
    { x: 500, y: 450, width: 100, height: 100 }
  ];

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-lg">
      <svg
        width="800"
        height="600"
        viewBox="0 0 800 600"
        className="w-full h-full cursor-crosshair"
        onClick={handleMapClick}
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
          </pattern>
          
          {/* Car icon definition */}
          <g id="carIcon">
            <rect x="-10" y="-15" width="20" height="30" rx="4" fill="currentColor" stroke="white" strokeWidth="2"/>
            <rect x="-8" y="-12" width="16" height="10" rx="2" fill="rgba(255,255,255,0.3)"/>
            <circle cx="-7" cy="10" r="3" fill="#333"/>
            <circle cx="7" cy="10" r="3" fill="#333"/>
            <circle cx="-7" cy="-10" r="3" fill="#333"/>
            <circle cx="7" cy="-10" r="3" fill="#333"/>
          </g>
        </defs>
        
        <rect width="800" height="600" fill="url(#grid)" />

        {/* Render city buildings as obstacles if city map is selected */}
        {mapType === 'city' && cityBuildings.map((b, i) => (
          <rect
            key={`building-${i}`}
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            fill="#444"
            stroke="#222"
            strokeWidth={3}
            opacity={0.7}
            rx={8}
          />
        ))}

        {/* Traffic conditions */}
        {traffic.map((condition, index) => (
          <g key={`traffic-${index}`}>
            <circle
              cx={condition.position.x}
              cy={condition.position.y}
              r={condition.affectedRadius}
              fill={getTrafficColor(condition.severity)}
              fillOpacity={0.2}
              stroke={getTrafficColor(condition.severity)}
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <Icons.AlertTriangle
              x={condition.position.x - 12}
              y={condition.position.y - 12}
              width={24}
              height={24}
              fill={getTrafficColor(condition.severity)}
            />
          </g>
        ))}

        {/* Pedestrians */}
        {pedestrians.map((pedestrian) => (
          <g key={pedestrian.id}>
            {/* Path to destination */}
            <line
              x1={pedestrian.position.x}
              y1={pedestrian.position.y}
              x2={pedestrian.destination.x}
              y2={pedestrian.destination.y}
              stroke={pedestrian.isBlocking ? '#EF4444' : '#6B7280'}
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.5}
            />
            
            {/* Pedestrian circle */}
            <circle
              cx={pedestrian.position.x}
              cy={pedestrian.position.y}
              r={pedestrian.isBlocking ? 8 : 6}
              fill={pedestrian.isBlocking ? '#EF4444' : '#3B82F6'}
              stroke="white"
              strokeWidth={2}
            />
            
            {/* Pedestrian icon */}
            <Icons.User
              x={pedestrian.position.x - 6}
              y={pedestrian.position.y - 6}
              width={12}
              height={12}
              fill="white"
            />
          </g>
        ))}

        {/* Vehicle detection cones (for debugging) */}
        {vehicles.map((vehicle) => {
          if (!vehicle.isMoving || vehicle.currentRouteIndex >= vehicle.route.length - 1) {
            return null;
          }

          const current = vehicle.position;
          const target = vehicle.route[vehicle.currentRouteIndex + 1];
          const dirX = target.x - current.x;
          const dirY = target.y - current.y;
          const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
          
          if (dirLength === 0) return null;

          const normDirX = dirX / dirLength;
          const normDirY = dirY / dirLength;
          
          // Detection cone points
          const detectionRange = 100;
          const coneWidth = 30;
          
          const endX = current.x + normDirX * detectionRange;
          const endY = current.y + normDirY * detectionRange;
          
          const leftX = endX + (-normDirY) * coneWidth;
          const leftY = endY + normDirX * coneWidth;
          
          const rightX = endX + normDirY * coneWidth;
          const rightY = endY + (-normDirX) * coneWidth;

          return (
            <g key={`${vehicle.id}-detection`}>
              <polygon
                points={`${current.x},${current.y} ${leftX},${leftY} ${rightX},${rightY}`}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            </g>
          );
        })}

        {/* Vehicles */}
        {vehicles.map((vehicle, idx) => {
          const rotation = getVehicleRotation(vehicle);
          const vehicleColor = vehicle.isMoving ? '#2563EB' : '#6B7280';
          // Only show trails for av-001 in city mode
          const showTrails =
            mapType === 'warehouse' ||
            (mapType === 'city' && vehicle.id.toLowerCase() === 'av-001');
          return (
            <g key={vehicle.id}>
              {/* Route path: Traversed portion */}
              {showTrails && vehicle.route.length > 1 && vehicle.currentRouteIndex > 0 && (
                <polyline
                  points={vehicle.route.slice(0, vehicle.currentRouteIndex + 1).map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#A0AEC0"
                  strokeWidth={2}
                  opacity={0.4}
                />
              )}
              {/* Route path: Remaining portion */}
              {showTrails && vehicle.route.length > 1 && (
                <polyline
                  points={vehicle.route.slice(vehicle.currentRouteIndex).map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  strokeDasharray="6,6"
                  opacity={0.8}
                />
              )}
              {/* Waypoint markers */}
              {showTrails && vehicle.route.length > 1 && (
                <>
                  {vehicle.route.map((point, idx) => (
                    <circle
                      key={`waypoint-${vehicle.id}-${idx}`}
                      cx={point.x}
                      cy={point.y}
                      r={idx === vehicle.route.length - 1 ? 8 : 4}
                      fill={idx === vehicle.route.length - 1 ? '#EF4444' : '#3B82F6'}
                      stroke="white"
                      strokeWidth={idx === vehicle.route.length - 1 ? 2 : 1}
                      opacity={idx >= vehicle.currentRouteIndex ? 1 : 0.3}
                    />
                  ))}
                </>
              )}
              {/* Vehicle shadow */}
              <use
                href="#carIcon"
                x={vehicle.position.x + 2}
                y={vehicle.position.y + 2}
                transform={`rotate(${rotation} ${vehicle.position.x + 2} ${vehicle.position.y + 2})`}
                fill="rgba(0,0,0,0.2)"
              />
              {/* Main vehicle */}
              <use
                href="#carIcon"
                x={vehicle.position.x}
                y={vehicle.position.y}
                transform={`rotate(${rotation} ${vehicle.position.x} ${vehicle.position.y})`}
                fill={vehicleColor}
              >
                {vehicle.isMoving && (
                  <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite"/>
                )}
              </use>
              {/* Battery indicator */}
              <rect
                x={vehicle.position.x - 12}
                y={vehicle.position.y - 28}
                width={24}
                height={4}
                fill={getBatteryColor(vehicle.parameters.batteryPercentage)}
                rx={2}
                stroke="white"
                strokeWidth={1}
              />
              {/* Vehicle ID label */}
              <text
                x={vehicle.position.x}
                y={vehicle.position.y - 32}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
                fontWeight="bold"
              >
                {vehicle.id}
              </text>
              {/* Direction indicator for moving vehicles */}
              {vehicle.isMoving && vehicle.currentRouteIndex < vehicle.route.length - 1 && (
                <Icons.Navigation
                  x={vehicle.position.x + 15}
                  y={vehicle.position.y - 15}
                  width={12}
                  height={12}
                  fill="#2563EB"
                  transform={`rotate(${rotation} ${vehicle.position.x + 21} ${vehicle.position.y - 9})`}
                />
              )}
              {/* Warning indicator for pedestrians in path */}
              {pedestrians.some(ped => isPedestrianInPath(vehicle, ped) && ped.isBlocking) && (
                <circle
                  cx={vehicle.position.x + 18}
                  cy={vehicle.position.y + 18}
                  r={6}
                  fill="#EF4444"
                  stroke="white"
                  strokeWidth={2}
                >
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
                </circle>
              )}
              {/* Vehicle HUD: only for selected vehicle */}
              {idx === selectedVehicleIndex && (
                <VehicleHUD vehicle={vehicle} currentPosition={vehicle.position} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Enhanced map legend */}
      <div className="absolute top-4 right-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs">
        <h3 className="font-semibold mb-2 text-gray-800">Map Legend</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-4 bg-blue-600 rounded-sm"></div>
            <span className="text-gray-700">Active Vehicle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-4 bg-gray-500 rounded-sm"></div>
            <span className="text-gray-700">Stopped Vehicle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Blocking Pedestrian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Moving Pedestrian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icons.AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-gray-700">Traffic Condition</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-blue-400 opacity-30"></div>
            <span className="text-gray-700">Detection Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-red-500"></div>
            <span className="text-gray-700">Pedestrian Alert</span>
          </div>
        </div>
      </div>
    </div>
  );
};