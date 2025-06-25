import React from 'react';
import { Vehicle } from '../types/simulation';
import { Battery, Gauge, Thermometer, Fuel, Activity, Clock, MapPin, Zap } from 'lucide-react';

interface VehicleStatsTableProps {
  vehicles: Vehicle[];
  selectedVehicleIndex: number;
  onVehicleSelect: (index: number) => void;
}

export const VehicleStatsTable: React.FC<VehicleStatsTableProps> = ({
  vehicles,
  selectedVehicleIndex,
  onVehicleSelect
}) => {
  const getBatteryColor = (percentage: number) => {
    if (percentage > 60) return 'text-green-600 bg-green-50';
    if (percentage > 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTirePressureColor = (pressure: number) => {
    if (pressure > 90) return 'text-green-600 bg-green-50';
    if (pressure > 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getHealthScore = (vehicle: Vehicle) => {
    const batteryScore = vehicle.parameters.batteryPercentage;
    const tireScore = (vehicle.parameters.tirePressure / 100) * 100;
    const speedScore = (vehicle.parameters.speed / vehicle.parameters.initialSpeed) * 100;
    return Math.round((batteryScore + tireScore + speedScore) / 3);
  };

  const getHealthColor = (score: number) => {
    if (score > 80) return 'text-green-600 bg-green-50';
    if (score > 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Vehicle Statistics Dashboard
        </h2>
        <p className="text-blue-100 text-sm mt-1">Real-time monitoring of all autonomous vehicles</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Battery</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Speed</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tire Pressure</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Health</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Distance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vehicles.map((vehicle, index) => {
              const healthScore = getHealthScore(vehicle);
              const isSelected = index === selectedVehicleIndex;
              
              return (
                <tr 
                  key={vehicle.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onVehicleSelect(index)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${vehicle.isMoving ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="font-medium text-gray-900">{vehicle.id}</span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      vehicle.isMoving 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.isMoving ? 'Moving' : 'Stopped'}
                    </span>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${getBatteryColor(vehicle.parameters.batteryPercentage).split(' ')[0]}`} />
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getBatteryColor(vehicle.parameters.batteryPercentage)}`}>
                        {Math.round(vehicle.parameters.batteryPercentage)}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(vehicle.parameters.speed)} km/h
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Gauge className={`w-4 h-4 ${getTirePressureColor(vehicle.parameters.tirePressure).split(' ')[0]}`} />
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getTirePressureColor(vehicle.parameters.tirePressure)}`}>
                        {Math.round(vehicle.parameters.tirePressure)} PSI
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Activity className={`w-4 h-4 ${getHealthColor(healthScore).split(' ')[0]}`} />
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getHealthColor(healthScore)}`}>
                        {healthScore}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {vehicle.totalDistance < 1000 
                          ? `${Math.round(vehicle.totalDistance)}m` 
                          : `${(vehicle.totalDistance / 1000).toFixed(1)}km`
                        }
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600 max-w-xs truncate block">
                      {vehicle.lastDecision}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicles Active</h3>
          <p className="text-gray-500">Add vehicles to start monitoring their statistics</p>
        </div>
      )}
    </div>
  );
};