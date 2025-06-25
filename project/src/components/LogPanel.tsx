import React from 'react';
import { LogEntry } from '../types/simulation';
import { Clock, Navigation, AlertTriangle, User, Zap } from 'lucide-react';

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const getEventIcon = (event: string) => {
    switch (event) {
      case 'REROUTE': return <Navigation className="w-4 h-4 text-blue-600" />;
      case 'PEDESTRIAN_STOP': return <User className="w-4 h-4 text-red-600" />;
      case 'TRAFFIC_DELAY': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'BATTERY_LOW': return <Zap className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case 'REROUTE': return 'border-l-blue-500 bg-blue-50';
      case 'PEDESTRIAN_STOP': return 'border-l-red-500 bg-red-50';
      case 'TRAFFIC_DELAY': return 'border-l-amber-500 bg-amber-50';
      case 'BATTERY_LOW': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Activity Log
      </h2>

      <div className="flex-1 overflow-y-auto space-y-2">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs">Start the simulation to see logs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 50).map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className={`border-l-4 p-3 rounded-r-lg ${getEventColor(log.event)} transition-all duration-200 hover:shadow-sm`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getEventIcon(log.event)}
                    <span className="font-medium text-sm text-gray-800">
                      Vehicle {log.vehicleId}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700 mb-1">
                  {log.details}
                </div>
                
                <div className="text-xs text-gray-500">
                  Position: ({Math.round(log.position.x)}, {Math.round(log.position.y)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {logs.length > 50 && (
        <div className="border-t pt-2 mt-2 text-center text-xs text-gray-500">
          Showing latest 50 entries of {logs.length} total
        </div>
      )}
    </div>
  );
};