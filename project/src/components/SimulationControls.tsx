import React from 'react';
import { Play, Pause, RotateCcw, Settings, Zap, AlertTriangle } from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  simulationSpeed: number;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onSpeedChange: (speed: number) => void;
  onAddVehicle: () => void;
  onGenerateTraffic: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  simulationSpeed,
  onToggleSimulation,
  onResetSimulation,
  onSpeedChange,
  onAddVehicle,
  onGenerateTraffic
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Simulation Controls
      </h2>

      {/* Primary Controls */}
      <div className="flex gap-2">
        <button
          onClick={onToggleSimulation}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRunning 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={onResetSimulation}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Speed Control */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Simulation Speed: {simulationSpeed}x
        </label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={simulationSpeed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.1x</span>
          <span>5x</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t pt-4 space-y-2">
        <button
          onClick={onAddVehicle}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Add Vehicle
        </button>

        <button
          onClick={onGenerateTraffic}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Generate Traffic
        </button>
      </div>

      {/* Instructions */}
      <div className="border-t pt-4 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ul className="space-y-1 text-xs">
          <li>• Click on map to set vehicle destinations</li>
          <li>• Red pedestrians block vehicle movement</li>
          <li>• Vehicles reroute based on traffic and battery</li>
          <li>• Watch battery levels and tire pressure</li>
        </ul>
      </div>
    </div>
  );
};