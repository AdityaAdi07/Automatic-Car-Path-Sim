import React, { useEffect, useRef, useState } from 'react';
import { Simulation } from '../utils/simulation';
import { VehicleHUD } from './VehicleHUD';
import { ActiveAlgorithms } from './ActiveAlgorithms';
import { Vehicle } from '../types/vehicle';

export const SimulationView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [activeAlgorithms, setActiveAlgorithms] = useState([
    {
      name: 'Dijkstra',
      description: 'Finding shortest path',
      isActive: true
    },
    {
      name: 'A*',
      description: 'Optimizing route with heuristics',
      isActive: true
    },
    {
      name: 'TSP',
      description: 'Optimizing multiple destinations',
      isActive: false
    },
    {
      name: 'Bellman-Ford',
      description: 'Handling negative weights',
      isActive: false
    },
    {
      name: 'Dynamic Programming',
      description: 'Optimizing battery usage',
      isActive: true
    }
  ]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize simulation
    const sim = new Simulation(canvas);
    setSimulation(sim);

    // Start simulation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sim.update();
      sim.render(ctx);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Update active algorithms based on simulation state
    const updateAlgorithms = () => {
      setActiveAlgorithms(prev => prev.map(algo => {
        if (algo.name === 'TSP' && sim.vehicles.some((v: Vehicle) => v.route.length > 2)) {
          return { ...algo, isActive: true };
        }
        if (algo.name === 'Bellman-Ford' && sim.vehicles.some((v: Vehicle) => v.lastDecision.includes('traffic'))) {
          return { ...algo, isActive: true };
        }
        return algo;
      }));
    };

    const algorithmInterval = setInterval(updateAlgorithms, 1000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      clearInterval(algorithmInterval);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      {simulation?.vehicles.map((vehicle: Vehicle) => (
        <VehicleHUD
          key={vehicle.id}
          vehicle={vehicle}
          currentPosition={vehicle.position}
        />
      ))}
      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1000 }}>
        <ActiveAlgorithms algorithms={activeAlgorithms} />
      </div>
    </div>
  );
}; 