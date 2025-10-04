'use client';

import { useState } from 'react';
import { RoutePlanningMap } from '../../components/RoutePlanningMap';
import { VehicleSelector } from '../../components/VehicleSelector';
import { RoutePreferences } from '../../components/RoutePreferences';
import { RouteResults } from '../../components/RouteResults';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Vehicle, Stop, OptimizeRouteDto, OptimizedRouteResponse } from '@yatms/common';

export interface ExtendedStop extends Stop {
  label: string;
  estimatedArrival?: string;
}

export default function RoutesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [stops, setStops] = useState<ExtendedStop[]>([]);
  const [preferences, setPreferences] = useState<{
    avoidTolls: boolean;
    avoidHighways: boolean;
    optimizeFor: 'time' | 'distance' | 'fuel';
  }>({
    avoidTolls: false,
    avoidHighways: false,
    optimizeFor: 'time',
  });
  const [optimizationResult, setOptimizationResult] = useState<OptimizedRouteResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimizeRoute = async () => {
    if (!selectedVehicle || stops.length < 2) {
      setError('Please select a vehicle and add at least 2 stops');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const requestBody: OptimizeRouteDto = {
        vehicleId: selectedVehicle.id,
        stops: stops.map(stop => ({
          id: stop.id,
          latitude: stop.latitude,
          longitude: stop.longitude,
          address: stop.address,
          priority: stop.priority,
        })),
        preferences,
      };
      
      
      const response = await fetch('http://localhost:4004/traffic/routes/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: OptimizedRouteResponse = await response.json();
      setOptimizationResult(result);
      
      const optimizedStops: ExtendedStop[] = result.optimizedRoute.waypoints.map((waypoint, index: number) => ({
        ...waypoint,
        id: stops[index]?.id || `stop-${Date.now()}-${index}`,
        label: stops[index]?.label || `Stop ${index + 1}`,
        address: waypoint.address,
        latitude: waypoint.latitude,
        longitude: waypoint.longitude,
        estimatedArrival: waypoint.estimatedArrival,
      }));
      setStops(optimizedStops);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleResetAll = () => {
    setSelectedVehicle(null);
    setStops([]);
    setPreferences({
      avoidTolls: false,
      avoidHighways: false,
      optimizeFor: 'time',
    });
    setOptimizationResult(null);
    setError(null);
    setIsOptimizing(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Route Optimization</h1>
            <p className="mt-2 text-gray-600">
              Plan your route by selecting addresses on the map and optimizing for your preferred travel style.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Vehicle Selection */}
              <VehicleSelector
                selectedVehicle={selectedVehicle}
                onVehicleSelect={setSelectedVehicle}
                onVehiclesLoad={setVehicles}
              />

              {/* Route Preferences */}
              <RoutePreferences
                preferences={preferences}
                onPreferencesChange={setPreferences}
              />
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <RoutePlanningMap
                  stops={stops}
                  onStopsChange={setStops}
                  optimizedRoute={optimizationResult?.optimizedRoute}
                  isOptimizing={isOptimizing}
                />
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleOptimizeRoute}
                    disabled={isOptimizing || !selectedVehicle || stops.length < 2}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {isOptimizing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Optimizing Route...
                      </span>
                    ) : (
                      'Optimize Route'
                    )}
                  </button>

                  <button
                    onClick={handleResetAll}
                    disabled={isOptimizing}
                    className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset All
                    </span>
                  </button>
                </div>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-900 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {optimizationResult && (
                <RouteResults result={optimizationResult} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
