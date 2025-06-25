import React from 'react';
import { Vehicle } from '../types/simulation';
import { Battery, Fuel, Gauge, Thermometer as Speedometer, MapPin, Activity } from 'lucide-react';

interface VehiclePanelProps {
  vehicle: Vehicle;
}

export const VehiclePanel: React.FC<VehiclePanelProps> = ({ vehicle }) => {
  const getBatteryColor = (percentage: number) => {
    if (percentage > 60) return 'text-green-600';
    if (percentage > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTirePressureColor = (pressure: number) => {
    if (pressure > 90) return 'text-green-600';
    if (pressure > 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDistance = (distance: number) => {
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Vehicle {vehicle.id}</h2>
        <div className={`px-2 py-1 rounded-full text-sm font-medium ${
          vehicle.isMoving ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {vehicle.isMoving ? 'Moving' : 'Stopped'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Battery Status */}
        <div className="flex items-center space-x-2">
          <Battery className={`w-5 h-5 ${getBatteryColor(vehicle.parameters.batteryPercentage)}`} />
          <div>
            <div className="text-sm text-gray-600">Battery</div>
            <div className={`font-semibold ${getBatteryColor(vehicle.parameters.batteryPercentage)}`}>
              {Math.round(vehicle.parameters.batteryPercentage)}%
            </div>
          </div>
        </div>

        {/* Speed */}
        <div className="flex items-center space-x-2">
          <Speedometer className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-sm text-gray-600">Speed</div>
            <div className="font-semibold text-blue-600">
              {Math.round(vehicle.parameters.speed)} km/h
            </div>
          </div>
        </div>

        {/* Tire Pressure */}
        <div className="flex items-center space-x-2">
          <Gauge className={`w-5 h-5 ${getTirePressureColor(vehicle.parameters.tirePressure)}`} />
          <div>
            <div className="text-sm text-gray-600">Tire Pressure</div>
            <div className={`font-semibold ${getTirePressureColor(vehicle.parameters.tirePressure)}`}>
              {Math.round(vehicle.parameters.tirePressure)} PSI
            </div>
          </div>
        </div>

        {/* Fuel Consumption */}
        <div className="flex items-center space-x-2">
          <Fuel className="w-5 h-5 text-amber-600" />
          <div>
            <div className="text-sm text-gray-600">Consumption</div>
            <div className="font-semibold text-amber-600">
              {vehicle.parameters.fuelConsumptionPerBlock.toFixed(1)}/km
            </div>
          </div>
        </div>
      </div>

      {/* Position and Distance */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Position: ({Math.round(vehicle.position.x)}, {Math.round(vehicle.position.y)})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Distance: {formatDistance(vehicle.totalDistance)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Mileage: {Math.round(vehicle.parameters.mileage)} km
        </div>
      </div>

      {/* Last Decision */}
      <div className="border-t pt-3">
        <div className="text-sm text-gray-600 mb-1">Last Decision:</div>
        <div className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded">
          {vehicle.lastDecision}
        </div>
      </div>

      {/* Route Progress */}
      <div className="border-t pt-3">
        <div className="text-sm text-gray-600 mb-2">Route Progress:</div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, (vehicle.currentRouteIndex / Math.max(1, vehicle.route.length - 1)) * 100)}%` 
            }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Waypoint {vehicle.currentRouteIndex + 1} of {vehicle.route.length}
        </div>
      </div>
    </div>
  );
};