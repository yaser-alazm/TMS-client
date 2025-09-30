'use client';

import { useState } from 'react';

interface TestResult {
  success: boolean;
  message: string;
  tests?: string[];
  userData?: any;
  error?: string;
}

export default function CacheTestPage() {
  const [basicResult, setBasicResult] = useState<TestResult | null>(null);
  const [userResult, setUserResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [redisKeys, setRedisKeys] = useState<string[]>([]);
  const [timingResult, setTimingResult] = useState<{
    cacheMiss: number;
    cacheHit: number;
    improvement: number;
    userId?: string;
  } | null>(null);

  const testBasicCache = async () => {
    setLoading(true);
    try {
      console.log('Testing basic cache...');
      const response = await fetch('http://localhost:4001/cache-test/basic', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Basic cache result:', result);
      setBasicResult(result);
    } catch (error) {
      console.error('Basic cache error:', error);
      setBasicResult({
        success: false,
        message: 'Failed to test basic cache',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    setLoading(false);
  };

  const testUserCache = async () => {
    setLoading(true);
    try {
      console.log('Testing user cache...');
      const response = await fetch('http://localhost:4001/cache-test/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('User cache result:', result);
      setUserResult(result);
    } catch (error) {
      console.error('User cache error:', error);
      setUserResult({
        success: false,
        message: 'Failed to test user cache',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    setLoading(false);
  };

  const checkRedisKeys = async () => {
    setLoading(true);
    try {
      console.log('Checking Redis keys...');
      const response = await fetch('http://localhost:4001/redis-keys/user-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Redis keys result:', result);
      
      if (result.success) {
        setRedisKeys(result.keys);
      } else {
        console.error('Failed to fetch Redis keys:', result.error);
        setRedisKeys([]);
      }
    } catch (error) {
      console.error('Failed to check Redis keys:', error);
      setRedisKeys([]);
    }
    setLoading(false);
  };

  const testUserOperations = async () => {
    setLoading(true);
    try {
      // Register a new user directly with user service
      const registerResponse = await fetch('http://localhost:4001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include', 
        body: JSON.stringify({
          username: `testuser${Date.now()}`,
          email: `test${Date.now()}@example.com`,
          password: 'password123'
        }),
      });

      if (!registerResponse.ok) {
        throw new Error('Failed to register user');
      }

      const registerData = await registerResponse.json();
      const userId = registerData.user.userId;

      // Test user lookup (cache miss) directly with user service
      const start1 = performance.now();
      const userResponse1 = await fetch(`http://localhost:4001/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
      });
      const end1 = performance.now();
      const time1 = end1 - start1;

      if (!userResponse1.ok) {
        throw new Error(`First user lookup failed: ${userResponse1.status}`);
      }

      // Test user lookup (cache hit) directly with user service
      const start2 = performance.now();
      const userResponse2 = await fetch(`http://localhost:4001/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include', 
      });
      const end2 = performance.now();
      const time2 = end2 - start2;

      if (!userResponse2.ok) {
        throw new Error(`Second user lookup failed: ${userResponse2.status}`);
      }

      const improvement = ((time1 - time2) / time1) * 100;
      
      setTimingResult({
        cacheMiss: time1,
        cacheHit: time2,
        improvement: improvement,
        userId: userId
      });

      setBasicResult({
        success: true,
        message: `User operations completed. First call: ${time1.toFixed(2)}ms, Second call: ${time2.toFixed(2)}ms`,
        tests: [
          `Cache miss: ${time1.toFixed(2)}ms`, 
          `Cache hit: ${time2.toFixed(2)}ms`,
          `Performance improvement: ${improvement.toFixed(1)}%`
        ]
      });

    } catch (error) {
      setBasicResult({
        success: false,
        message: 'Failed to test user operations',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Redis Cache Testing</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Cache Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Cache Operations</h2>
            <button
              onClick={testBasicCache}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mb-4"
            >
              {loading ? 'Testing...' : 'Test Basic Cache'}
            </button>
            
            {basicResult && (
              <div className={`p-4 rounded ${basicResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h3 className="font-semibold mb-2">{basicResult.message}</h3>
                {basicResult.tests && (
                  <ul className="list-disc list-inside mb-2">
                    {basicResult.tests.map((test, index) => (
                      <li key={index} className="text-sm">{test}</li>
                    ))}
                  </ul>
                )}
                {basicResult.error && (
                  <p className="text-red-600 text-sm">{basicResult.error}</p>
                )}
              </div>
            )}
          </div>

          {/* User Cache Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">User Cache Operations</h2>
            <button
              onClick={testUserCache}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mb-4"
            >
              {loading ? 'Testing...' : 'Test User Cache'}
            </button>
            
            {userResult && (
              <div className={`p-4 rounded ${userResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <h3 className="font-semibold mb-2">{userResult.message}</h3>
                {userResult.userData && (
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(userResult.userData, null, 2)}
                  </pre>
                )}
                {userResult.error && (
                  <p className="text-red-600 text-sm">{userResult.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Real User Operations Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Real User Operations</h2>
            <button
              onClick={testUserOperations}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mb-4"
            >
              {loading ? 'Testing...' : 'Test User Operations'}
            </button>
            
            <p className="text-sm text-gray-600 mb-4">
              This will create a new user and test cache performance with real database operations.
            </p>

            {timingResult && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Cache Performance Results</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-red-100 p-3 rounded">
                    <div className="font-semibold text-red-800">Cache Miss</div>
                    <div className="text-2xl font-bold text-red-600">{timingResult.cacheMiss.toFixed(2)}ms</div>
                    <div className="text-red-600">Database Query</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded">
                    <div className="font-semibold text-green-800">Cache Hit</div>
                    <div className="text-2xl font-bold text-green-600">{timingResult.cacheHit.toFixed(2)}ms</div>
                    <div className="text-green-600">Redis Cache</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <div className="text-lg font-semibold text-blue-800">
                    {timingResult.improvement > 0 ? '⚡' : '⚠️'} {Math.abs(timingResult.improvement).toFixed(1)}% 
                    {timingResult.improvement > 0 ? ' faster' : ' slower'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {timingResult.improvement > 0 
                      ? `Cache is ${(timingResult.cacheMiss / timingResult.cacheHit).toFixed(1)}x faster than database`
                      : 'Cache performance issue detected'
                    }
                  </div>
                </div>
                {timingResult.userId && (
                  <div className="mt-2 text-xs text-gray-500">
                    User ID: {timingResult.userId}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Redis Keys Display */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Redis Keys</h2>
            <button
              onClick={checkRedisKeys}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mb-4"
            >
              {loading ? 'Checking...' : 'Check Redis Keys'}
            </button>
            
            {redisKeys.length > 0 && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold mb-2">Current Redis Keys:</h3>
                <ul className="list-disc list-inside">
                  {redisKeys.map((key, index) => (
                    <li key={index} className="text-sm font-mono">{key}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure Redis and the user service are running</li>
            <li>Click "Test Basic Cache" to verify Redis operations</li>
            <li>Click "Test User Cache" to test user-specific caching</li>
            <li>Click "Test User Operations" to see real performance differences with timing comparison</li>
            <li>Click "Check Redis Keys" to see what's currently cached</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">Performance Testing</h3>
            <p className="text-sm text-yellow-700">
              The "Test User Operations" button will create a new user, then make two identical API calls:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
              <li><strong>First call:</strong> Cache miss - queries database (slower)</li>
              <li><strong>Second call:</strong> Cache hit - returns from Redis (faster)</li>
            </ul>
            <p className="text-sm text-yellow-700 mt-2">
              You'll see the timing difference and performance improvement percentage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
