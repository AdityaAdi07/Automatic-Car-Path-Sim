import React from 'react';
import { Vehicle, Position } from '../types/simulation';
import * as Icons from 'lucide-react';

interface VehicleHUDProps {
  vehicle: Vehicle;
  currentPosition: Position;
}

export const VehicleHUD: React.FC<VehicleHUDProps> = ({ vehicle, currentPosition }) => {
  // Calculate distance to destination
  const getDistanceToDestination = () => {
    if (!vehicle.route.length) return '0';
    const destination = vehicle.route[vehicle.route.length - 1];
    const dx = destination.x - currentPosition.x;
    const dy = destination.y - currentPosition.y;
    return Math.sqrt(dx * dx + dy * dy).toFixed(0);
  };

  // Calculate ETA based on current speed and distance
  const getETA = () => {
    const distance = parseFloat(getDistanceToDestination());
    if (vehicle.parameters.speed === 0) return '∞';
    const timeInSeconds = distance / vehicle.parameters.speed;
    if (timeInSeconds < 60) return `${timeInSeconds.toFixed(0)}s`;
    return `${(timeInSeconds / 60).toFixed(1)}m`;
  };

  return (
    <foreignObject
      x={currentPosition.x - 90}
      y={currentPosition.y - 100}
      width="180"
      height="80"
      style={{ overflow: 'visible' }}
    >
      <div className="bg-black/25 text-white rounded-lg p-2 text-xs font-mono shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm">{vehicle.id}</span>
          <div className="flex items-center gap-1">
            {vehicle.isMoving ? (
              <Icons.Play className="w-3 h-3 text-green-400" />
            ) : (
              <Icons.Pause className="w-3 h-3 text-red-400" />
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-1">
            <Icons.Gauge className="w-3 h-3 text-blue-400" />
            <span className="font-semibold">{vehicle.parameters.speed.toFixed(0)} u/s</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.MapPin className="w-3 h-3 text-red-400" />
            <span className="font-semibold">{getDistanceToDestination()}u</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.Clock className="w-3 h-3 text-yellow-400" />
            <span className="font-semibold">ETA: {getETA()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.Battery className="w-3 h-3 text-green-400" />
            <span className="font-semibold">{vehicle.parameters.batteryPercentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Status indicators */}
        <div className="mt-1 pt-1 border-t border-white/15 flex flex-col gap-1">
          {/* Pedestrian Status */}
          {(vehicle.lastDecision.includes('pedestrian') || 
            vehicle.lastDecision.includes('PEDESTRIAN_STOP') || 
            vehicle.lastDecision.includes('PEDESTRIAN_SLOW') ||
            vehicle.lastDecision.includes('Stopped for pedestrian') ||
            vehicle.lastDecision.includes('PEDESTRIAN_BLOCKING_REROUTE')) && (
            <div className="flex items-center gap-1 text-red-400">
              <Icons.User className="w-3 h-3" />
              <span className="font-semibold">
                {vehicle.lastDecision.includes('Stopped for pedestrian') || vehicle.lastDecision.includes('PEDESTRIAN_STOP')
                  ? 'Stopped: Pedestrian in path' 
                  : vehicle.lastDecision.includes('PEDESTRIAN_SLOW')
                    ? 'Slowing down: Pedestrian ahead'
                    : vehicle.lastDecision.includes('PEDESTRIAN_BLOCKING_REROUTE')
                      ? 'Multiple pedestrians ahead'
                      : 'Pedestrian detected ahead'}
              </span>
            </div>
          )}

          {/* Traffic Status */}
          {(vehicle.lastDecision.includes('traffic') || 
            vehicle.lastDecision.includes('TRAFFIC_ACCUMULATION') || 
            vehicle.lastDecision.includes('HIGH_TRAFFIC') ||
            vehicle.lastDecision.includes('TRAFFIC_ACCUMULATION_REROUTE') ||
            vehicle.lastDecision.includes('HIGH_TRAFFIC_AVOID')) && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Icons.AlertTriangle className="w-3 h-3" />
              <span className="font-semibold">
                {vehicle.lastDecision.includes('HIGH_TRAFFIC') || vehicle.lastDecision.includes('HIGH_TRAFFIC_AVOID')
                  ? 'High traffic zone detected' 
                  : vehicle.lastDecision.includes('TRAFFIC_ACCUMULATION') || vehicle.lastDecision.includes('TRAFFIC_ACCUMULATION_REROUTE')
                    ? 'Heavy traffic ahead' 
                    : 'Traffic encountered'}
              </span>
            </div>
          )}

          {/* Path Change Status */}
          {(vehicle.lastDecision.includes('Rerouting') || 
            vehicle.lastDecision.includes('REROUTE') || 
            vehicle.lastDecision.includes('BATTERY_LOW') || 
            vehicle.lastDecision.includes('TIRE_PRESSURE') ||
            vehicle.lastDecision.includes('BATTERY_LOW_REROUTE') ||
            vehicle.lastDecision.includes('TIRE_PRESSURE_REROUTE') ||
            vehicle.lastDecision.includes('PEDESTRIAN_BLOCKING_REROUTE') ||
            vehicle.lastDecision.includes('Rerouted due to traffic/pedestrian conditions') ||
            vehicle.lastDecision.includes('Emergency reroute: Critical battery level') ||
            vehicle.lastDecision.includes('Reroute: Low tire pressure detected')) && (
            <div className="flex items-center gap-1 text-blue-400">
              <Icons.Route className="w-3 h-3" />
              <span className="font-semibold">
                {vehicle.lastDecision.includes('BATTERY_LOW') || vehicle.lastDecision.includes('BATTERY_LOW_REROUTE') || vehicle.lastDecision.includes('Emergency reroute: Critical battery level')
                  ? 'Rerouting: Low battery' 
                  : vehicle.lastDecision.includes('TIRE_PRESSURE') || vehicle.lastDecision.includes('TIRE_PRESSURE_REROUTE') || vehicle.lastDecision.includes('Reroute: Low tire pressure detected')
                    ? 'Rerouting: Low tire pressure' 
                    : vehicle.lastDecision.includes('HIGH_TRAFFIC_AVOID')
                      ? 'Rerouting: Avoiding high traffic'
                      : vehicle.lastDecision.includes('PEDESTRIAN_BLOCKING_REROUTE')
                        ? 'Rerouting: Multiple pedestrians ahead'
                        : 'Path changed due to traffic'}
              </span>
            </div>
          )}

          {/* Destination Status */}
          {vehicle.lastDecision.includes('Destination reached') && (
            <div className="flex items-center gap-1 text-green-400">
              <Icons.CheckCircle className="w-3 h-3" />
              <span className="font-semibold">Destination Reached</span>
            </div>
          )}
        </div>
      </div>
    </foreignObject>
  );
}; 