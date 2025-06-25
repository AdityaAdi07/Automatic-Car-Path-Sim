import React from 'react';
import { Vehicle, LogEntry } from '../types/simulation';
import { Battery, Fuel, Gauge, MapPin, Activity, Clock, Navigation, Zap, TrendingUp } from 'lucide-react';

interface DetailedVehiclePanelProps {
  vehicle: Vehicle;
  logs: LogEntry[];
}

export const DetailedVehiclePanel: React.FC<DetailedVehiclePanelProps> = ({ vehicle, logs }) => {
  if (!vehicle) {
    return null;
  }

  const getBatteryColor = (percentage: number) => {
    if (percentage > 60) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage > 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTirePressureColor = (pressure: number) => {
    if (pressure > 90) return 'text-green-600 bg-green-50 border-green-200';
    if (pressure > 80) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSpeedColor = (speed: number, maxSpeed: number) => {
    const ratio = speed / maxSpeed;
    if (ratio > 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (ratio > 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatDistance = (distance: number) => {
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  const getHealthScore = () => {
    const batteryScore = vehicle.parameters.batteryPercentage;
    const tireScore = (vehicle.parameters.tirePressure / 100) * 100;
    const speedScore = (vehicle.parameters.speed / vehicle.parameters.initialSpeed) * 100;
    return Math.round((batteryScore + tireScore + speedScore) / 3);
  };

  const healthScore = getHealthScore();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden w-[80%] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Vehicle {vehicle.id}</h2>
            <p className="text-blue-100 text-sm">Detailed Performance Metrics</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            vehicle.isMoving ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            {vehicle.isMoving ? 'Active' : 'Stopped'}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Battery */}
          <div className={`border rounded-lg p-4 ${getBatteryColor(vehicle.parameters.batteryPercentage)}`}>
            <div className="flex items-center justify-between mb-2">
              <Battery className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wide">Battery</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(vehicle.parameters.batteryPercentage)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-current h-2 rounded-full transition-all duration-300"
                style={{ width: `${vehicle.parameters.batteryPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Speed */}
          <div className={`border rounded-lg p-4 ${getSpeedColor(vehicle.parameters.speed, vehicle.parameters.initialSpeed)}`}>
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wide">Speed</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(vehicle.parameters.speed)}</div>
            <div className="text-sm opacity-75">km/h</div>
          </div>

          {/* Tire Pressure */}
          <div className={`border rounded-lg p-4 ${getTirePressureColor(vehicle.parameters.tirePressure)}`}>
            <div className="flex items-center justify-between mb-2">
              <Gauge className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wide">Tire</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(vehicle.parameters.tirePressure)}</div>
            <div className="text-sm opacity-75">PSI</div>
          </div>

          {/* Health Score */}
          <div className={`border rounded-lg p-4 ${
            healthScore > 80 ? 'text-green-600 bg-green-50 border-green-200' :
            healthScore > 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
            'text-red-600 bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wide">Health</span>
            </div>
            <div className="text-2xl font-bold">{healthScore}%</div>
            <div className="text-sm opacity-75">Overall</div>
          </div>
        </div>

        {/* Detailed Stats Table */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Detailed Statistics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Position
                </span>
                <span className="font-medium">
                  ({Math.round(vehicle.position.x)}, {Math.round(vehicle.position.y)})
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Total Distance
                </span>
                <span className="font-medium">{formatDistance(vehicle.totalDistance)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Mileage
                </span>
                <span className="font-medium">{Math.round(vehicle.parameters.mileage)} km</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  Fuel Consumption
                </span>
                <span className="font-medium">{vehicle.parameters.fuelConsumptionPerBlock.toFixed(1)}/km</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Route Progress
                </span>
                <span className="font-medium">
                  {vehicle.currentRouteIndex + 1} / {vehicle.route.length}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Max Speed
                </span>
                <span className="font-medium">{vehicle.parameters.initialSpeed} km/h</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Battery className="w-4 h-4" />
                  Battery Capacity
                </span>
                <span className="font-medium">{vehicle.parameters.maxBatteryCapacity}%</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  Fuel Capacity
                </span>
                <span className="font-medium">{vehicle.parameters.maxFuelCapacity}L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Route Progress */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Route Progress
          </h3>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${((vehicle.currentRouteIndex + 1) / vehicle.route.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-gray-50 rounded-lg p-4 w-full">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Logs
          </h3>
          <div className="max-h-60 overflow-y-auto text-sm text-gray-700 w-full">
            {logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="py-2 px-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-900 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}:</span>
                      <span className="flex-1">{log.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No recent logs.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};