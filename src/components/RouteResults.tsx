'use client';

import { OptimizedRouteResponse } from '@yatms/common';

interface RouteResultsProps {
  result: OptimizedRouteResponse;
}

export const RouteResults: React.FC<RouteResultsProps> = ({ result }) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (kilometers: number) => {
    return `${kilometers.toFixed(2)} km`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateSavings = () => {
    const timeSavedPercentage = (result.optimizationMetrics.timeSaved / 
      (result.optimizedRoute.totalDuration + result.optimizationMetrics.timeSaved)) * 100;
    const distanceSavedPercentage = (result.optimizationMetrics.distanceSaved / 
      (result.optimizedRoute.totalDistance + result.optimizationMetrics.distanceSaved)) * 100;

    return {
      timeSavedPercentage: Math.round(timeSavedPercentage),
      distanceSavedPercentage: Math.round(distanceSavedPercentage),
    };
  };

  const savings = calculateSavings();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 Optimization Results</h3>
        <div className="text-sm text-gray-500">
          Request ID: {result.requestId.slice(0, 8)}...
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-700">
            {formatDistance(result.optimizedRoute.totalDistance)}
          </div>
          <div className="text-sm text-green-600">Total Distance</div>
        </div>
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">
            {formatDuration(result.optimizedRoute.totalDuration)}
          </div>
          <div className="text-sm text-blue-600">Total Duration</div>
        </div>
      </div>

      {/* Savings Metrics */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">💰 Optimization Savings</h4>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg mr-2">⏱️</span>
              <span className="font-medium text-gray-900">Time Saved</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-orange-700">{formatTime(result.optimizationMetrics.timeSaved)}</div>
              <div className="text-sm text-orange-600">{savings.timeSavedPercentage}% improvement</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg mr-2">📏</span>
              <span className="font-medium text-gray-900">Distance Saved</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-purple-700">{formatDistance(result.optimizationMetrics.distanceSaved)}</div>
              <div className="text-sm text-purple-600">{savings.distanceSavedPercentage}% improvement</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-lg mr-2">⛽</span>
              <span className="font-medium text-gray-900">Fuel Saved</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-emerald-700">{result.optimizationMetrics.fuelSaved.toFixed(2)}L</div>
              <div className="text-sm text-emerald-600">Estimated savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Waypoints */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">📍 Optimized Route</h4>
        <div className="space-y-2">
          {result.optimizedRoute.waypoints.map((waypoint, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{waypoint.address}</div>
                <div className="text-sm text-gray-600">
                  {waypoint.latitude.toFixed(4)}, {waypoint.longitude.toFixed(4)}
                </div>
              </div>
              {waypoint.estimatedArrival && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(waypoint.estimatedArrival).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  {index > 0 && (
                    <div className="text-xs text-gray-500">
                      ETA from previous
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
          📱 Share Route
        </button>
        <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium">
          📤 Export
        </button>
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-1">💡 Route Notes:</div>
          <ul className="space-y-1 text-xs">
            <li>• Route optimized using Google Maps Directions API</li>
            <li>• Duration calculations include current traffic conditions</li>
            <li>• Estimated arrival times are based on average driving speeds</li>
            <li>• Consider refreshing the route for updated traffic data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
