'use client';

import { RoutePreferences as RoutePrefs } from '@yatms/common';

interface RoutePreferencesProps {
  preferences: RoutePrefs;
  onPreferencesChange: (preferences: RoutePrefs) => void;
}

export const RoutePreferences: React.FC<RoutePreferencesProps> = ({
  preferences,
  onPreferencesChange,
}) => {
  const handleAvoidTollsChange = (checked: boolean) => {
    onPreferencesChange({ ...preferences, avoidTolls: checked });
  };

  const handleAvoidHighwaysChange = (checked: boolean) => {
    onPreferencesChange({ ...preferences, avoidHighways: checked });
  };

  const handleOptimizeForChange = (value: 'time' | 'distance' | 'fuel') => {
    onPreferencesChange({ ...preferences, optimizeFor: value });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Preferences</h3>
      
      <div className="space-y-6">
        {/* Optimization Type */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            🎯 Optimization Priority
          </label>
          <div className="space-y-2">
            {[
              { type: 'time', label: 'Fastest', icon: '⏱️', description: 'Minimize travel time' },
              { type: 'distance', label: 'Shortest', icon: '📏', description: 'Minimize distance' },
              { type: 'fuel', label: 'Most Efficient', icon: '⛽', description: 'Minimize fuel consumption' },
            ].map(({ type, label, icon, description }) => (
              <label
                key={type}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  preferences.optimizeFor === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="optimizeFor"
                  value={type}
                  checked={preferences.optimizeFor === type}
                  onChange={(e) => handleOptimizeForChange(e.target.value as any)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 w-full">
                  <div className="text-xl">{icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-600">{description}</div>
                  </div>
                  {preferences.optimizeFor === type && (
                    <div className="text-blue-600">✓</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Route Constraints */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            🚫 Avoid
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.avoidTolls}
                onChange={(e) => handleAvoidTollsChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="text-lg mr-2">💰</span>
                  <span className="font-medium text-gray-900">Toll Roads</span>
                </div>
                <div className="text-sm text-gray-600">Avoid toll roads and highways with fees</div>
              </div>
            </label>

            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.avoidHighways}
                onChange={(e) => handleAvoidHighwaysChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🛣️</span>
                  <span className="font-medium text-gray-900">Highways</span>
                </div>
                <div className="text-sm text-gray-600">Use local roads instead of highways when possible</div>
              </div>
            </label>
          </div>
        </div>

        {/* Optimization Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-600 mr-3 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Optimization Notes:</div>
              <ul className="space-y-1 text-xs">
                <li>• Routes are calculated using real-time Google Maps data</li>
                <li>• Duration estimates include traffic conditions</li>
                <li>• Multiple optimization attempts may provide better results</li>
                <li>• Avoidances may increase travel distance or time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
