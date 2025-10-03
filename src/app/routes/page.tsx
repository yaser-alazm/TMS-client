'use client';

import { useState } from 'react';
import { RoutePlanningMap } from '../../components/RoutePlanningMap';
import { VehicleSelector } from '../../components/VehicleSelector';
import { RoutePreferences } from '../../components/RoutePreferences';
import { RouteResults } from '../../components/RouteResults';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Vehicle, Stop, OptimizeRouteDto, OptimizedRouteResponse } from '@yatms/common';

// Extend Stop to add frontend-specific properties
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
      
      console.log('Sending optimization request:', JSON.stringify(requestBody, null, 2));
      
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
      
      // Update stops with optimized waypoints while preserving ID fields
      const optimizedStops: ExtendedStop[] = result.optimizedRoute.waypoints.map((waypoint, index: number) => ({
        ...waypoint,
        id: stops[index]?.id || `stop-${Date.now()}-${index}`, // Preserve original ID or generate new one
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
                vehicles={vehicles}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={setSelectedVehicle}
                onVehiclesLoad={setVehicles}
              />

              {/* Route Preferences */}
              <RoutePreferences
                preferences={preferences}
                onPreferencesChange={setPreferences}
              />

              {/* Optimization Controls */}
              <div className="bg-white rounded-lg shadow p-6">
                <button
                  onClick={handleOptimizeRoute}
                  disabled={isOptimizing || !selectedVehicle || stops.length < 2}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
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

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-900 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Route Results */}
              {optimizationResult && (
                <RouteResults result={optimizationResult} />
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="lg:col-span-2">
              <RoutePlanningMap
                stops={stops}
                onStopsChange={setStops}
                optimizedRoute={optimizationResult?.optimizedRoute}
                isOptimizing={isOptimizing}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
