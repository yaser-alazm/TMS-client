'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouteOptimization } from '../hooks/useRouteOptimization';

interface Stop {
  id?: string;
  latitude: number;
  longitude: number;
  address: string;
  priority?: number;
}

interface RoutePreferences {
  avoidTolls: boolean;
  avoidHighways: boolean;
  optimizeFor: 'time' | 'distance' | 'fuel';
}

interface OptimizedRoute {
  totalDistance: number;
  totalDuration: number;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    address: string;
    estimatedArrival: string;
  }>;
}

interface OptimizationMetrics {
  timeSaved: number;
  distanceSaved: number;
  fuelSaved: number;
}

interface RouteOptimizationResult {
  requestId: string;
  optimizedRoute: OptimizedRoute;
  optimizationMetrics: OptimizationMetrics;
}

export const RouteOptimization: React.FC = () => {
  const { user } = useAuth();
  const [stops, setStops] = useState<Stop[]>([
    { id: 'stop-1', latitude: 52.5200, longitude:  13.404954, address: 'Berlin, Germany' },
    { id: 'stop-2', latitude: 52.5700, longitude: 13.405000, address: 'Berlin, Germany' },
  ]);
  const [preferences, setPreferences] = useState<RoutePreferences>({
    avoidTolls: false,
    avoidHighways: false,
    optimizeFor: 'time',
  });
  const [vehicleId, setVehicleId] = useState<string>('53ac84a9-ddcc-4a1c-a153-e9738c026e03'); // Pre-filled with test vehicle ID
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<RouteOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizationStatus, setOptimizationStatus] = useState<string>('');

  // Memoize callbacks to prevent infinite re-renders
  const onRouteOptimized = useCallback((data: any) => {
    setOptimizationStatus('Route optimization completed!');
    setIsOptimizing(false);
  }, []);

  const onRouteOptimizationFailed = useCallback((data: any) => {
    setOptimizationStatus('Route optimization failed');
    setError(data.error || 'Unknown error occurred');
    setIsOptimizing(false);
  }, []);

  const onRouteUpdateRequested = useCallback((data: any) => {
    setOptimizationStatus('Route update requested');
  }, []);

  const { isConnected, subscribeToRouteUpdates, unsubscribeFromRouteUpdates } = useRouteOptimization({
    onRouteOptimized,
    onRouteOptimizationFailed,
    onRouteUpdateRequested,
  });

  const addStop = () => {
    const newStopId = `stop-${Date.now()}`;
    setStops([...stops, { id: newStopId, latitude: 0, longitude: 0, address: '' }]);
  };

  const removeStop = (index: number) => {
    if (stops.length > 2) {
      setStops(stops.filter((_, i) => i !== index));
    }
  };

  const updateStop = (index: number, field: keyof Stop, value: any) => {
    const updatedStops = [...stops];
    updatedStops[index] = { ...updatedStops[index], [field]: value };
    setStops(updatedStops);
  };

  const optimizeRoute = async () => {
    if (!vehicleId || stops.length < 2) {
      setError('Please provide a vehicle ID and at least 2 stops');
      return;
    }

    // Debug authentication
    console.log('Route optimization - User:', user);
    console.log('Route optimization - Using cookie-based authentication');

    if (!user) {
      setError('Authentication required. Please log in first.');
      return;
    }

    setIsOptimizing(true);
    setError(null);
    setResult(null);
    setOptimizationStatus('Starting route optimization...');

    try {
      const response = await fetch('http://localhost:4000/traffic/routes/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          vehicleId,
          stops,
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setOptimizationStatus('Route optimization completed!');

      // Subscribe to real-time updates for this request
      subscribeToRouteUpdates(data.requestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setOptimizationStatus('Route optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDistance = (kilometers: number) => {
    return `${kilometers.toFixed(2)} km`;
  };

  if (!user) {
    return <div className="p-4 text-center">Please log in to use route optimization</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Route Optimization</h2>
        
        {/* Authentication Status */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-900">
                <strong>Authentication Status:</strong> {user ? `Logged in as ${user.email}` : 'Not logged in'}
              </p>
              <p className="text-xs text-blue-700">
                Auth: {user ? 'Cookie-based' : 'Not authenticated'}
              </p>
            </div>
            {!user && (
              <a 
                href="/login" 
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Login
              </a>
            )}
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-600' : 'bg-red-600'
            }`}></div>
            {isConnected ? 'Connected to real-time updates' : 'Disconnected'}
          </div>
        </div>

        {/* Vehicle ID */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Vehicle ID
          </label>
          <input
            type="text"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter vehicle ID"
          />
        </div>

        {/* Stops */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Stops</h3>
            <button
              onClick={addStop}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Stop
            </button>
          </div>
          
          {stops.map((stop, index) => (
            <div key={index} className="flex gap-4 mb-4 p-4 border border-gray-200 rounded-md">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={stop.address}
                  onChange={(e) => updateStop(index, 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Enter address"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={stop.latitude}
                  onChange={(e) => updateStop(index, 'latitude', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={stop.longitude}
                  onChange={(e) => updateStop(index, 'longitude', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              {stops.length > 2 && (
                <button
                  onClick={() => removeStop(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 self-end"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Preferences */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Route Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center text-gray-900">
                <input
                  type="checkbox"
                  checked={preferences.avoidTolls}
                  onChange={(e) => setPreferences({ ...preferences, avoidTolls: e.target.checked })}
                  className="mr-2"
                />
                Avoid Tolls
              </label>
            </div>
            <div>
              <label className="flex items-center text-gray-900">
                <input
                  type="checkbox"
                  checked={preferences.avoidHighways}
                  onChange={(e) => setPreferences({ ...preferences, avoidHighways: e.target.checked })}
                  className="mr-2"
                />
                Avoid Highways
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Optimize For
              </label>
              <select
                value={preferences.optimizeFor}
                onChange={(e) => setPreferences({ ...preferences, optimizeFor: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="time">Time</option>
                <option value="distance">Distance</option>
                <option value="fuel">Fuel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optimize Button */}
        <button
          onClick={optimizeRoute}
          disabled={isOptimizing || !vehicleId || stops.length < 2}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isOptimizing ? 'Optimizing Route...' : 'Optimize Route'}
        </button>

        {/* Status */}
        {optimizationStatus && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-900">{optimizationStatus}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-semibold mb-4 text-green-900">Optimization Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {formatDuration(result.optimizedRoute.totalDuration)}
                </div>
                <div className="text-sm text-gray-700">Total Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {formatDistance(result.optimizedRoute.totalDistance)}
                </div>
                <div className="text-sm text-gray-700">Total Distance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {result.optimizedRoute.waypoints.length}
                </div>
                <div className="text-sm text-gray-700">Waypoints</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-gray-900">Optimization Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-700">
                    {formatDuration(result.optimizationMetrics.timeSaved)}
                  </div>
                  <div className="text-sm text-gray-700">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-700">
                    {formatDistance(result.optimizationMetrics.distanceSaved)}
                  </div>
                  <div className="text-sm text-gray-700">Distance Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-700">
                    {result.optimizationMetrics.fuelSaved.toFixed(2)}L
                  </div>
                  <div className="text-sm text-gray-700">Fuel Saved</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-gray-900">Optimized Route</h4>
              <div className="space-y-2">
                {result.optimizedRoute.waypoints.map((waypoint, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <div className="font-medium text-gray-900">{waypoint.address}</div>
                      <div className="text-sm text-gray-700">
                        {waypoint.latitude.toFixed(4)}, {waypoint.longitude.toFixed(4)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      ETA: {new Date(waypoint.estimatedArrival).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
