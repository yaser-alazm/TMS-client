import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface RouteOptimizationUpdate {
  requestId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  timestamp: string;
  data?: any;
  error?: string;
}

interface UseRouteOptimizationOptions {
  onRouteOptimized?: (data: RouteOptimizationUpdate) => void;
  onRouteOptimizationFailed?: (data: RouteOptimizationUpdate) => void;
  onRouteUpdateRequested?: (data: RouteOptimizationUpdate) => void;
}

export const useRouteOptimization = ({
  onRouteOptimized,
  onRouteOptimizationFailed,
  onRouteUpdateRequested,
}: UseRouteOptimizationOptions) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:4004/routes', {
      transports: ['websocket'],
      withCredentials: true, 
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to route optimization WebSocket');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from route optimization WebSocket');
    });

    newSocket.on('connect_error', (err) => {
      setError(err.message);
      console.error('WebSocket connection error:', err);
    });

    newSocket.on('connected', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    newSocket.on('route_optimization_requested', (data) => {
      console.log('Route optimization requested:', data);
    });

    newSocket.on('route_optimized', (data) => {
      console.log('Route optimized:', data);
      onRouteOptimized?.(data);
    });

    newSocket.on('route_optimization_failed', (data) => {
      console.log('Route optimization failed:', data);
      onRouteOptimizationFailed?.(data);
    });

    newSocket.on('route_update_requested', (data) => {
      console.log('Route update requested:', data);
      onRouteUpdateRequested?.(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [onRouteOptimized, onRouteOptimizationFailed, onRouteUpdateRequested]);

  const subscribeToRouteUpdates = useCallback(
    (requestId: string) => {
      if (socket && isConnected) {
        socket.emit('subscribe_route_updates', { requestId });
        console.log(`Subscribed to route updates for ${requestId}`);
      }
    },
    [socket, isConnected],
  );

  const unsubscribeFromRouteUpdates = useCallback(
    (requestId: string) => {
      if (socket && isConnected) {
        socket.emit('unsubscribe_route_updates', { requestId });
        console.log(`Unsubscribed from route updates for ${requestId}`);
      }
    },
    [socket, isConnected],
  );

  return {
    socket,
    isConnected,
    error,
    subscribeToRouteUpdates,
    unsubscribeFromRouteUpdates,
  };
};
