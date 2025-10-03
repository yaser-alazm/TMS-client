'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Stop, OptimizedRouteResponse } from '@yatms/common';

// Extended stop for map component (with label for display)
interface ExtendedStop extends Stop {
  label: string;
  estimatedArrival?: string;
}

interface RoutePlanningMapProps {
  stops: ExtendedStop[];
  onStopsChange: (stops: ExtendedStop[]) => void;
  optimizedRoute?: OptimizedRouteResponse['optimizedRoute'];
  isOptimizing: boolean;
}

const MapComponent: React.FC<{
  stops: ExtendedStop[];
  onStopsChange: (stops: ExtendedStop[]) => void;
}> = ({ stops, onStopsChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    console.log('Creating Google Map instance...');
    
    googleMapRef.current = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 52.5200, lng: 13.4049 },
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    console.log('Google Map created successfully');
  }, []);

  useEffect(() => {
    if (!googleMapRef.current) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    stops.forEach((stop, index) => {
      const marker = new google.maps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map: googleMapRef.current,
        title: `${stop.label}: ${stop.address}`,
        draggable: true,
        icon: {
          url: `https://maps.google.com/mapfiles/ms/icons/${index === 0 ? 'red' : index === stops.length - 1 ? 'green' : 'yellow'}.png`,
          scaledSize: new google.maps.Size(32, 32),
        },
      });

      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          const lat = position.lat();
          const lng = position.lng();
          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const updatedStops = stops.map(s => 
                s.id === stop.id 
                  ? { ...s, latitude: lat, longitude: lng, address: results[0].formatted_address }
                  : s
              );
              onStopsChange(updatedStops);
            } else {
              const updatedStops = stops.map(s => 
                s.id === stop.id ? { ...s, latitude: lat, longitude: lng } : s
              );
              onStopsChange(updatedStops);
            }
          });
        }
      });

      markersRef.current.push(marker);
    });
  }, [stops, onStopsChange]);

  useEffect(() => {
    if (!googleMapRef.current) return;

    const handler = google.maps.event.addListener(googleMapRef.current, 'click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const newStop: ExtendedStop = {
              id: `stop-${Date.now()}`,
              label: `Stop ${stops.length + 1}`,
              address: results[0].formatted_address,
              latitude: lat,
              longitude: lng,
            };
            onStopsChange([...stops, newStop]);
          }
        });
      }
    });

    return () => google.maps.event.removeListener(handler);
  }, [stops, onStopsChange]);

  useEffect(() => {
    if (stops.length === 0 || !googleMapRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    stops.forEach(stop => bounds.extend({ lat: stop.latitude, lng: stop.longitude }));

    if (stops.length === 1) {
      googleMapRef.current.setCenter({ lat: stops[0].latitude, lng: stops[0].longitude });
      googleMapRef.current.setZoom(15);
    } else {
      googleMapRef.current.fitBounds(bounds);
    }
  }, [stops]);

  return <div ref={mapRef} className="h-96 w-full" />;
};

const LoadingComponent = () => (
  <div className="bg-white rounded-lg shadow h-96 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-gray-600">Loading Google Maps...</p>
    </div>
  </div>
);

const ErrorComponent = () => (
  <div className="bg-white rounded-lg shadow h-96 flex items-center justify-center">
    <div className="text-center">
      <div className="text-red-500 mb-2">⚠️</div>
      <p className="text-red-600">Failed to load Google Maps</p>
      <p className="text-sm text-gray-600 mt-1">Check your API key configuration</p>
    </div>
  </div>
);

export const RoutePlanningMap: React.FC<RoutePlanningMapProps> = ({
  stops,
  onStopsChange,
  optimizedRoute,
  isOptimizing,
}) => {
  console.log('RoutePlanningMap rendering with API key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
  console.log('Google Maps API Key value:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent />;
      case Status.FAILURE:
        return <ErrorComponent />;
      case Status.SUCCESS:
        return (
          <MapComponent
            stops={stops}
            onStopsChange={onStopsChange}
          />
        );
      default:
        return <LoadingComponent />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Interactive Route Planner</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Start</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Stops</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>End</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Click on the map to add stops, drag markers to move them.
        </p>
      </div>

      <div className="relative">
        <Wrapper 
          libraries={['places', 'geometry']} 
          render={render}
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        />
        
        {isOptimizing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-900 font-medium">Optimizing Route...</p>
              <p className="text-sm text-gray-600">This may take a few moments</p>
            </div>
          </div>
        )}

        {optimizedRoute && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 min-w-48">
            <h4 className="font-semibold text-gray-900 mb-2">Route Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{(optimizedRoute.totalDistance).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{Math.round(optimizedRoute.totalDuration / 60)} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stops:</span>
                <span className="font-medium">{optimizedRoute.waypoints.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};