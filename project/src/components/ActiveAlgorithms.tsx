import React from 'react';
import { Icons } from './Icons';

interface ActiveAlgorithmsProps {
  algorithms: {
    name: string;
    description: string;
    isActive: boolean;
  }[];
}

export const ActiveAlgorithms: React.FC<ActiveAlgorithmsProps> = ({ algorithms }) => {
  return (
    <div className="bg-black/25 text-white rounded-lg p-1.5 text-[10px] font-mono shadow-lg backdrop-blur-sm max-w-[200px]">
      <div className="flex items-center gap-1 mb-0.5">
        <Icons.Cpu className="w-2.5 h-2.5 text-blue-400" />
        <span className="font-bold text-[11px]">Active Algorithms</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {algorithms.map((algo, index) => (
          algo.isActive && (
            <div key={index} className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold">{algo.name}</span>
              <span className="text-white/70 text-[9px]">- {algo.description}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}; 