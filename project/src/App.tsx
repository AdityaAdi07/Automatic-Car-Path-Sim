import React, { useState, useEffect, useCallback } from 'react';
import { SimulationEngine } from './utils/simulation';
import { PathfindingEngine } from './utils/pathfinding';
import { SimulationMap } from './components/SimulationMap';
import { VehicleStatsTable } from './components/VehicleStatsTable';
import { DetailedVehiclePanel } from './components/DetailedVehiclePanel';
import { SimulationControls } from './components/SimulationControls';
import { EnvironmentControls } from './components/EnvironmentControls';
import { LogPanel } from './components/LogPanel';
import { SimulationState, Position, TrafficCondition, Pedestrian, LogEntry } from './types/simulation';
import * as Icons from 'lucide-react';
import { warehouseStorageUnits } from './components/SimulationMap';

function App() {
  const [simulationEngine] = useState(() => new SimulationEngine());
  const [simulationState, setSimulationState] = useState<SimulationState>({
    vehicles: [],
    traffic: [],
    pedestrians: [],
    isRunning: false,
    simulationSpeed: 1.0,
    currentTime: 0
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [mapType, setMapType] = useState<'warehouse' | 'city'>('warehouse');
  const [selectedStorageUnitIds, setSelectedStorageUnitIds] = useState<string[]>([]);

  const cityPathfinder = new PathfindingEngine();

  // Green zones for each map layout
  const warehouseGreenZones = [
    { x: 120, y: 120 }
  ];
  const cityGreenZones = [
    { x: 700, y: 500 }
  ];
  const greenZones = mapType === 'city' ? cityGreenZones : warehouseGreenZones;

  // Store green zone for each vehicle at simulation start
  const [vehicleGreenZones, setVehicleGreenZones] = useState<{ [id: string]: { x: number; y: number } }>({});

  // Initialize simulation
  useEffect(() => {
    // Set the destination reached callback
    simulationEngine.setDestinationReachedCallback((vehicleId) => {
      setNotification({ message: `Vehicle ${vehicleId} reached its destination!`, type: 'success' });
      setTimeout(() => setNotification(null), 5000); // Clear notification after 5 seconds
    });

    let vehicles = [];
    const greenZoneMap: { [id: string]: { x: number; y: number } } = {};
    if (mapType === 'city') {
      vehicles = Array.from({ length: 5 }, (_, i) => {
        const v = simulationEngine.createVehicle(
          `AV-${String(i + 1).padStart(3, '0')}`,
          { x: 100 + i * 100, y: 100 },
          []
        );
        greenZoneMap[v.id] = cityGreenZones[0];
        return v;
      });
    } else {
      vehicles = [simulationEngine.createVehicle('AV-001', { x: 100, y: 100 }, [])];
      greenZoneMap['AV-001'] = warehouseGreenZones[0];
    }

    const traffic = simulationEngine.generateTrafficConditions();
    const pedestrians = simulationEngine.generatePedestrians();

    setVehicleGreenZones(greenZoneMap);
    setSimulationState(prev => ({
      ...prev,
      vehicles,
      traffic,
      pedestrians
    }));
  }, [simulationEngine, mapType]);

  useEffect(() => {
    simulationEngine.setMapType(mapType);
  }, [simulationEngine, mapType]);

  // Simulation loop
  useEffect(() => {
    if (!simulationState.isRunning) return;

    const interval = setInterval(() => {
      const deltaTime = 100 * simulationState.simulationSpeed;

      setSimulationState(prev => {
        let vehicles = prev.vehicles;
        // Only for city layout: make non-selected vehicles move like pedestrians
        if (mapType === 'city') {
          vehicles = vehicles.map((vehicle, i) => {
            if (i === selectedVehicleIndex) return vehicle;
            if (vehicle.lowBatteryMode) return vehicle;
            // If stopped or at destination, assign a new random destination and route
            if (!vehicle.isMoving || vehicle.currentRouteIndex >= vehicle.route.length - 1) {
              let newDest;
              let tries = 0;
              do {
                newDest = { x: Math.random() * 800, y: Math.random() * 600 };
                tries++;
              } while (
                !PathfindingEngine.isOnAnyRoad(newDest.x, newDest.y) ||
                PathfindingEngine.isInAnyBuilding(newDest.x, newDest.y, 10) && tries < 20
              );
              const newRoute = cityPathfinder.findPath(
                vehicle.position,
                newDest,
                prev.traffic,
                prev.pedestrians,
                vehicle.parameters,
                mapType
              );
              if (newRoute && newRoute.length > 1) {
                return {
                  ...vehicle,
                  route: newRoute,
                  currentRouteIndex: 0,
                  isMoving: true,
                  lastDecision: 'Auto-reroute to random destination'
                };
              }
            }
            return vehicle;
          });
        }
        const updatedVehicles = vehicles.map((vehicle, idx) =>
          simulationEngine.updateVehicle(
            vehicle,
            prev.traffic,
            prev.pedestrians,
            deltaTime,
            vehicles,
            selectedVehicleIndex,
            idx
          )
        );
        const updatedPedestrians = simulationEngine.updatePedestrians(prev.pedestrians, deltaTime);
        return {
          ...prev,
          vehicles: updatedVehicles,
          pedestrians: updatedPedestrians,
          currentTime: prev.currentTime + deltaTime
        };
      });
      // Update logs
      setLogs(simulationEngine.getLogs());
    }, 100);
    return () => clearInterval(interval);
  }, [simulationState.isRunning, simulationState.simulationSpeed, simulationEngine, mapType, selectedVehicleIndex]);

  const handleToggleSimulation = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      isRunning: !prev.isRunning
    }));
  }, []);

  const handleResetSimulation = useCallback(() => {
    let vehicles = [];
    if (mapType === 'city') {
      vehicles = Array.from({ length: 5 }, (_, i) =>
        simulationEngine.createVehicle(
          `AV-${String(i + 1).padStart(3, '0')}`,
          { x: 100 + i * 100, y: 100 },
          []
        )
      );
    } else {
      vehicles = [simulationEngine.createVehicle('AV-001', { x: 100, y: 100 }, [])];
    }
    const traffic = simulationEngine.generateTrafficConditions();
    const pedestrians = simulationEngine.generatePedestrians();
    setSimulationState(prev => ({
      ...prev,
      vehicles,
      traffic,
      pedestrians,
      isRunning: false,
      currentTime: 0
    }));
    setLogs([]);
    setSelectedVehicleIndex(0);
  }, [simulationEngine, mapType]);

  const handleSpeedChange = useCallback((speed: number) => {
    setSimulationState(prev => ({
      ...prev,
      simulationSpeed: speed
    }));
  }, []);

  const handleAddVehicle = useCallback(() => {
    const newVehicle = simulationEngine.createVehicle(
      `AV-${String(simulationState.vehicles.length + 1).padStart(3, '0')}`,
      { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 },
      [{ x: Math.random() * 200 + 600, y: Math.random() * 200 + 400 }] // New vehicles start with a random destination
    );

    setSimulationState(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle]
    }));
  }, [simulationEngine, simulationState.vehicles.length]);

  const handleGenerateTraffic = useCallback(() => {
    const newTraffic = simulationEngine.generateTrafficConditions();
    setSimulationState(prev => ({
      ...prev,
      traffic: newTraffic
    }));
  }, [simulationEngine]);

  const handleMapClick = useCallback((position: Position) => {
    if (simulationState.vehicles.length === 0) return;

    const selectedVehicle = simulationState.vehicles[selectedVehicleIndex];
    let updatedRoute: Position[];

    // If the vehicle has no route, start a new one from its current position to the clicked point.
    // Otherwise, append the new position to the end of the existing route.
    if (!selectedVehicle.route || selectedVehicle.route.length === 0) {
      updatedRoute = [selectedVehicle.position, position];
    } else {
      updatedRoute = [...selectedVehicle.route, position];
    }

    const updatedVehicle = {
      ...selectedVehicle,
      route: updatedRoute,
      currentRouteIndex: selectedVehicle.currentRouteIndex, // Do not reset, continue current path
      lastDecision: 'New waypoint added'
    };

    setSimulationState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle, index) =>
        index === selectedVehicleIndex ? updatedVehicle : vehicle
      )
    }));
  }, [simulationState.vehicles, selectedVehicleIndex]);

  // Environment control handlers
  const handleAddTraffic = useCallback((traffic: TrafficCondition) => {
    setSimulationState(prev => ({
      ...prev,
      traffic: [...prev.traffic, traffic]
    }));
  }, []);

  const handleAddPedestrian = useCallback((pedestrian: Pedestrian) => {
    setSimulationState(prev => ({
      ...prev,
      pedestrians: [...prev.pedestrians, pedestrian]
    }));
  }, []);

  const handleClearTraffic = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      traffic: []
    }));
  }, []);

  const handleClearPedestrians = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      pedestrians: []
    }));
  }, []);

  // Drain Fuel handler
  const handleDrainFuel = useCallback(() => {
    setSimulationState(prev => {
      if (prev.vehicles.length === 0) return prev;
      const selectedVehicle = prev.vehicles[selectedVehicleIndex];
      // Random battery between 5 and 20
      const newBattery = Math.floor(Math.random() * 16) + 5;
      // Always go to the stored green zone for this vehicle
      const curr = selectedVehicle.position;
      const greenZone = vehicleGreenZones[selectedVehicle.id] || greenZones[0];
      const newRoute = [curr, greenZone];
      return {
        ...prev,
        vehicles: prev.vehicles.map((v, i) =>
          i === selectedVehicleIndex
            ? {
                ...v,
                parameters: {
                  ...v.parameters,
                  batteryPercentage: newBattery
                },
                lowBatteryMode: true,
                route: newRoute,
                currentRouteIndex: 0,
                isMoving: true,
                lastDecision: 'Low battery mode: rerouting to green zone center'
              }
            : v
        )
      };
    });
  }, [selectedVehicleIndex, vehicleGreenZones, greenZones]);

  // Toggle storage unit selection (double-click)
  const handleToggleUnitSelect = useCallback((id: string) => {
    setSelectedStorageUnitIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(unitId => unitId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Compute selected storage unit waypoints (edge points, in order)
  const selectedStorageWaypoints = selectedStorageUnitIds
    .map(id => {
      const unit = warehouseStorageUnits.find(u => u.id === id);
      if (!unit) return null;
      // Find a point just outside the edge (8px away from the closest edge to the center)
      // We'll use left edge for now
      return {
        x: unit.x - 8, // 8px to the left of the unit
        y: unit.y + unit.height / 2
      };
    })
    .filter(Boolean) as { x: number; y: number }[];

  // When selectedStorageUnitIds changes, update the selected vehicle's route to include these waypoints before the destination
  useEffect(() => {
    setSimulationState(prev => {
      if (prev.vehicles.length === 0) return prev;
      const selectedVehicle = prev.vehicles[selectedVehicleIndex];
      const currentPos = selectedVehicle.position;
      let newRoute;
      if (selectedStorageWaypoints.length > 0) {
        newRoute = [currentPos, ...selectedStorageWaypoints];
      } else {
        const dest = selectedVehicle.route.length > 0 ? selectedVehicle.route[selectedVehicle.route.length - 1] : currentPos;
        newRoute = [currentPos, dest];
      }
      return {
        ...prev,
        vehicles: prev.vehicles.map((v, i) =>
          i === selectedVehicleIndex
            ? {
                ...v,
                route: newRoute,
                currentRouteIndex: 0
              }
            : v
        )
      };
    });
  }, [selectedStorageWaypoints, selectedVehicleIndex]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white z-50 transition-opacity duration-500 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`} role="alert">
          {notification.message}
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icons.Car className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  AV-SIMULATOR
                </h1>
                <p className="text-gray-600">
                  Real-time pathfinding with dynamic routing and environmental awareness
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Icons.BarChart3 className="w-4 h-4" />
                <span>Time: {Math.round(simulationState.currentTime / 1000)}s</span>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {simulationState.vehicles.length} Vehicle{simulationState.vehicles.length !== 1 ? 's' : ''}
              </div>
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                {simulationState.traffic.length} Traffic
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                {simulationState.pedestrians.length} Pedestrians
              </div>
            </div>
          </div>
        </div>

        {/* Map Type Dropdown */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 bg-white border border-gray-200 shadow-sm rounded-lg px-6 py-3">
            <Icons.Map className="w-6 h-6 text-blue-500" />
            <label className="mr-2 font-medium text-gray-800 text-lg">Map Layout:</label>
            <select
              value={mapType}
              onChange={e => setMapType(e.target.value as 'warehouse' | 'city')}
              className="text-base font-medium border border-gray-300 rounded-md px-5 py-1.5 bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all outline-none hover:border-blue-400 hover:bg-gray-50 duration-150 shadow-sm"
            >
              <option value="warehouse">🏭 Warehouse</option>
              <option value="city">🏙️ City</option>
            </select>
          </div>
        </div>

        {/* Vehicle Statistics Table */}
        <div className="mb-6">
          <VehicleStatsTable
            vehicles={simulationState.vehicles}
            selectedVehicleIndex={selectedVehicleIndex}
            onVehicleSelect={setSelectedVehicleIndex}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Map */}
          <div className="xl:col-span-2">
            <SimulationMap
              vehicles={simulationState.vehicles}
              traffic={simulationState.traffic}
              pedestrians={simulationState.pedestrians}
              onMapClick={handleMapClick}
              mapType={mapType}
              selectedVehicleIndex={selectedVehicleIndex}
              selectedUnitIds={selectedStorageUnitIds}
            />

            {/* Detailed Vehicle Panel - Moved below map */}
            {simulationState.vehicles.length > 0 && selectedVehicleIndex !== -1 && (
              <div className="mt-6">
                <DetailedVehiclePanel
                  vehicle={simulationState.vehicles[selectedVehicleIndex]}
                  logs={logs.filter(log => log.vehicleId === simulationState.vehicles[selectedVehicleIndex]?.id)}
                />
              </div>
            )}
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            {/* Simulation Controls */}
            <SimulationControls
              isRunning={simulationState.isRunning}
              simulationSpeed={simulationState.simulationSpeed}
              onToggleSimulation={handleToggleSimulation}
              onResetSimulation={handleResetSimulation}
              onSpeedChange={handleSpeedChange}
              onAddVehicle={handleAddVehicle}
              onGenerateTraffic={handleGenerateTraffic}
              onDrainFuel={handleDrainFuel}
              warehouseStorageUnits={warehouseStorageUnits}
              selectedUnitIds={selectedStorageUnitIds}
              onToggleUnitSelect={handleToggleUnitSelect}
            />

            {/* Environment Controls */}
            <EnvironmentControls
              onAddTraffic={handleAddTraffic}
              onAddPedestrian={handleAddPedestrian}
              onClearTraffic={handleClearTraffic}
              onClearPedestrians={handleClearPedestrians}
              trafficCount={simulationState.traffic.length}
              pedestrianCount={simulationState.pedestrians.length}
            />

            {/* Log Panel */}
            <LogPanel logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;