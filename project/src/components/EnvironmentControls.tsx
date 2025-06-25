import React, { useState } from 'react';
import { Position, TrafficCondition, Pedestrian } from '../types/simulation';
import { Plus, Users, AlertTriangle, MapPin, Trash2, Settings } from 'lucide-react';

interface EnvironmentControlsProps {
  onAddTraffic: (traffic: TrafficCondition) => void;
  onAddPedestrian: (pedestrian: Pedestrian) => void;
  onClearTraffic: () => void;
  onClearPedestrians: () => void;
  trafficCount: number;
  pedestrianCount: number;
}

export const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  onAddTraffic,
  onAddPedestrian,
  onClearTraffic,
  onClearPedestrians,
  trafficCount,
  pedestrianCount
}) => {
  const [trafficForm, setTrafficForm] = useState({
    x: 400,
    y: 300,
    severity: 'medium' as 'low' | 'medium' | 'high',
    radius: 50
  });

  const [pedestrianForm, setPedestrianForm] = useState({
    x: 200,
    y: 200,
    destX: 600,
    destY: 400,
    speed: 3,
    isBlocking: false
  });

  const handleAddTraffic = () => {
    const traffic: TrafficCondition = {
      position: { x: trafficForm.x, y: trafficForm.y },
      severity: trafficForm.severity,
      affectedRadius: trafficForm.radius
    };
    onAddTraffic(traffic);
  };

  const handleAddPedestrian = () => {
    const pedestrian: Pedestrian = {
      id: `manual_ped_${Date.now()}`,
      position: { x: pedestrianForm.x, y: pedestrianForm.y },
      destination: { x: pedestrianForm.destX, y: pedestrianForm.destY },
      speed: pedestrianForm.speed,
      isBlocking: pedestrianForm.isBlocking
    };
    onAddPedestrian(pedestrian);
  };

  const generateRandomPosition = () => {
    return {
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50
    };
  };

  const randomizeTraffic = () => {
    const pos = generateRandomPosition();
    setTrafficForm(prev => ({ ...prev, x: pos.x, y: pos.y }));
  };

  const randomizePedestrian = () => {
    const startPos = generateRandomPosition();
    const endPos = generateRandomPosition();
    setPedestrianForm(prev => ({
      ...prev,
      x: startPos.x,
      y: startPos.y,
      destX: endPos.x,
      destY: endPos.y
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Environment Controls
        </h2>
        <div className="flex gap-2 text-sm">
          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
            {trafficCount} Traffic
          </span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {pedestrianCount} Pedestrians
          </span>
        </div>
      </div>

      {/* Traffic Controls */}
      <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
        <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Add Traffic Condition
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
            <input
              type="number"
              min="0"
              max="800"
              value={trafficForm.x}
              onChange={(e) => setTrafficForm(prev => ({ ...prev, x: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
            <input
              type="number"
              min="0"
              max="600"
              value={trafficForm.y}
              onChange={(e) => setTrafficForm(prev => ({ ...prev, y: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={trafficForm.severity}
              onChange={(e) => setTrafficForm(prev => ({ ...prev, severity: e.target.value as 'low' | 'medium' | 'high' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radius</label>
            <input
              type="number"
              min="20"
              max="100"
              value={trafficForm.radius}
              onChange={(e) => setTrafficForm(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddTraffic}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Traffic
          </button>
          <button
            onClick={randomizeTraffic}
            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-medium transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Random Position
          </button>
          <button
            onClick={onClearTraffic}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Pedestrian Controls */}
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Add Pedestrian
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start X</label>
            <input
              type="number"
              min="0"
              max="800"
              value={pedestrianForm.x}
              onChange={(e) => setPedestrianForm(prev => ({ ...prev, x: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Y</label>
            <input
              type="number"
              min="0"
              max="600"
              value={pedestrianForm.y}
              onChange={(e) => setPedestrianForm(prev => ({ ...prev, y: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dest X</label>
            <input
              type="number"
              min="0"
              max="800"
              value={pedestrianForm.destX}
              onChange={(e) => setPedestrianForm(prev => ({ ...prev, destX: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dest Y</label>
            <input
              type="number"
              min="0"
              max="600"
              value={pedestrianForm.destY}
              onChange={(e) => setPedestrianForm(prev => ({ ...prev, destY: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.5"
              value={pedestrianForm.speed}
              onChange={(e) => setPedestrianForm(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={pedestrianForm.isBlocking}
                onChange={(e) => setPedestrianForm(prev => ({ ...prev, isBlocking: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Blocking
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddPedestrian}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Pedestrian
          </button>
          <button
            onClick={randomizePedestrian}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg font-medium transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Random Position
          </button>
          <button
            onClick={onClearPedestrians}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Quick Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click "Random Position" to generate random coordinates</li>
          <li>• High severity traffic causes more rerouting</li>
          <li>• Blocking pedestrians will stop vehicles completely</li>
          <li>• Larger radius affects more area around traffic</li>
          <li>• You can also click on the map to set vehicle destinations</li>
        </ul>
      </div>
    </div>
  );
};