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
  const handleOptimizeForChange = (value: 'time' | 'distance' | 'fuel') => {
    onPreferencesChange({ ...preferences, optimizeFor: value });
  };

  const handleAvoidTollsChange = (value: 'yes' | 'no') => {
    onPreferencesChange({ ...preferences, avoidTolls: value === 'yes' });
  };

  const handleAvoidHighwaysChange = (value: 'yes' | 'no') => {
    onPreferencesChange({ ...preferences, avoidHighways: value === 'yes' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Preferences</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="optimize-for" className="block text-sm font-medium text-gray-700 mb-2">
            🎯 Optimization Priority
          </label>
          <select
            id="optimize-for"
            value={preferences.optimizeFor}
            onChange={(e) => handleOptimizeForChange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
          >
            <option value="time">⏱️ Fastest - Minimize travel time</option>
            <option value="distance">📏 Shortest - Minimize distance</option>
            <option value="fuel">⛽ Most Efficient - Minimize fuel consumption</option>
          </select>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="avoid-tolls" className="block text-sm font-medium text-gray-700 mb-2">
              💰 Avoid Toll Roads
            </label>
            <select
              id="avoid-tolls"
              value={preferences.avoidTolls ? 'yes' : 'no'}
              onChange={(e) => handleAvoidTollsChange(e.target.value as 'yes' | 'no')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            >
              <option value="no">No - Use toll roads if faster</option>
              <option value="yes">Yes - Avoid toll roads and highways with fees</option>
            </select>
          </div>

          <div>
            <label htmlFor="avoid-highways" className="block text-sm font-medium text-gray-700 mb-2">
              🛣️ Avoid Highways
            </label>
            <select
              id="avoid-highways"
              value={preferences.avoidHighways ? 'yes' : 'no'}
              onChange={(e) => handleAvoidHighwaysChange(e.target.value as 'yes' | 'no')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            >
              <option value="no">No - Use highways when faster</option>
              <option value="yes">Yes - Use local roads instead of highways</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-700">
            <div className="font-medium mb-1">Current Settings:</div>
            <div className="space-y-1 text-xs">
              <div>• Priority: {preferences.optimizeFor === 'time' ? '⏱️ Fastest' : preferences.optimizeFor === 'distance' ? '📏 Shortest' : '⛽ Most Efficient'}</div>
              <div>• Toll Roads: {preferences.avoidTolls ? '🚫 Avoided' : '✅ Allowed'}</div>
              <div>• Highways: {preferences.avoidHighways ? '🚫 Avoided' : '✅ Allowed'}</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <div className="text-blue-600 mr-2 mt-0.5 text-sm">ℹ️</div>
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">Optimization Notes:</div>
              <ul className="space-y-1">
                <li>• Routes use real-time Google Maps data</li>
                <li>• Duration includes traffic conditions</li>
                <li>• Avoidances may increase travel time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
