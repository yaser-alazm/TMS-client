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
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 52.5200, lng: 13.4049 },
      mapTypeControl: false, 
      streetViewControl: true,
      fullscreenControl: true,
      mapTypeId: mapType,
      mapId: 'DEMO_MAP_ID', 
    });

    
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      suppressMarkers: true, 
      polylineOptions: {
        strokeColor: '#2563EB',
        strokeWeight: 5,
        strokeOpacity: 0.9,
      },
      suppressInfoWindows: true,
    });
    directionsRendererRef.current.setMap(googleMapRef.current);

  }, [mapType]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        console.error('Places API request failed:', response.status);
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        setSearchResults(data.predictions || []);
        setShowSearchResults(true);
      } else {
        console.warn('Places API error:', data.status, data.error_message);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, []);

  const getPlaceDetails = useCallback(async (placeId: string, geometry?: any) => {
    try {
      if (geometry && geometry.location) {
        const lat = geometry.location.lat;
        const lng = geometry.location.lng;
        
        const newStop: ExtendedStop = {
          id: `stop-${Date.now()}`,
          label: `Stop ${stops.length + 1}`,
          address: placeId, 
          latitude: lat,
          longitude: lng,
        };
        
        onStopsChange([...stops, newStop]);
        setSearchQuery('');
        setShowSearchResults(false);
        
        if (googleMapRef.current) {
          googleMapRef.current.setCenter({ lat, lng });
          googleMapRef.current.setZoom(15);
        }
        return;
      }

      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId }),
      });
      
      if (!response.ok) {
        console.error('Place details request failed:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const place = data.result;
        const lat = place.geometry.location.lat;
        const lng = place.geometry.location.lng;
        
        const newStop: ExtendedStop = {
          id: `stop-${Date.now()}`,
          label: `Stop ${stops.length + 1}`,
          address: place.formatted_address || '',
          latitude: lat,
          longitude: lng,
        };
        
        onStopsChange([...stops, newStop]);
        setSearchQuery('');
        setShowSearchResults(false);
        
        if (googleMapRef.current) {
          googleMapRef.current.setCenter({ lat, lng });
          googleMapRef.current.setZoom(15);
        }
      } else {
        console.warn('Place details API error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  }, [stops, onStopsChange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchPlaces]);

  useEffect(() => {
    if (!googleMapRef.current) return;

    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    stops.forEach((stop, index) => {
      // Create marker with custom styling
      const markerContent = document.createElement('div');
      markerContent.className = 'marker-content';
      markerContent.style.cssText = `
        background-color: ${index === 0 ? '#ef4444' : index === stops.length - 1 ? '#22c55e' : '#eab308'};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      markerContent.textContent = (index + 1).toString();

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: stop.latitude, lng: stop.longitude },
        map: googleMapRef.current,
        title: `${stop.label}: ${stop.address}`,
        content: markerContent,
        gmpDraggable: true,
      });

      // Enhanced drag handling with better geocoding
      marker.addListener('dragstart', () => {
        // Add bounce animation to the marker content
        markerContent.style.transform = 'scale(1.2)';
        markerContent.style.transition = 'transform 0.2s ease';
      });

      marker.addListener('dragend', () => {
        markerContent.style.transform = 'scale(1)';
        
        const position = marker.position;
        if (position) {
          const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
          const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
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
      marker.addListener('click', () => {
        if (stops.length > 1) { 
          const updatedStops = stops.filter(s => s.id !== stop.id);
          onStopsChange(updatedStops);
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

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setCurrentLocation({ lat, lng });
        
        if (googleMapRef.current) {
          googleMapRef.current.setCenter({ lat, lng });
          googleMapRef.current.setZoom(15);
        }

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const newStop: ExtendedStop = {
              id: `stop-${Date.now()}`,
              label: stops.length === 0 ? 'Start Location' : `Stop ${stops.length + 1}`,
              address: results[0].formatted_address,
              latitude: lat,
              longitude: lng,
            };
            onStopsChange([...stops, newStop]);
          }
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
        alert('Unable to get your current location. Please try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [stops, onStopsChange]);

  const handleMapTypeChange = useCallback((newMapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => {
    setMapType(newMapType);
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(newMapType);
    }
  }, []);

  const clearAllStops = useCallback(() => {
    onStopsChange([]);
  }, [onStopsChange]);

  const reorderStops = useCallback((fromIndex: number, toIndex: number) => {
    const newStops = [...stops];
    const [removed] = newStops.splice(fromIndex, 1);
    newStops.splice(toIndex, 0, removed);
    
    const updatedStops = newStops.map((stop, index) => ({
      ...stop,
      label: index === 0 ? 'Start Location' : index === newStops.length - 1 ? 'End Location' : `Stop ${index}`,
    }));
    
    onStopsChange(updatedStops);
  }, [stops, onStopsChange]);


  const removeStop = useCallback((stopId: string) => {
    if (stops.length > 1) {
      const updatedStops = stops.filter(stop => stop.id !== stopId);
      onStopsChange(updatedStops);
    }
  }, [stops, onStopsChange]);


  useEffect(() => {
    if (!googleMapRef.current || !directionsRendererRef.current) return;


    directionsRendererRef.current.setDirections({ routes: [], request: {} as google.maps.DirectionsRequest });

    if (stops.length >= 2) {
      const waypoints = stops.slice(1, -1).map(stop => ({
        location: { lat: stop.latitude, lng: stop.longitude },
        stopover: true,
      }));

      const request: google.maps.DirectionsRequest = {
        origin: { lat: stops[0].latitude, lng: stops[0].longitude },
        destination: { lat: stops[stops.length - 1].latitude, lng: stops[stops.length - 1].longitude },
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      };

      directionsServiceRef.current?.route(request, (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result);
        } else {
          console.warn('Directions request failed:', status);
        }
      });
    }
  }, [stops]);

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

  return (
    <div className="flex h-full w-full">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Search Locations</h3>
          
          <div className="relative">
            <input
              ref={searchBoxRef}
              type="text"
              placeholder="Search for addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 3 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute right-2 top-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.place_id}
                    onClick={() => getPlaceDetails(result.description, result.geometry)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{result.structured_formatting?.main_text || result.description}</div>
                    {result.structured_formatting?.secondary_text && (
                      <div className="text-gray-500 text-xs">{result.structured_formatting.secondary_text}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-2 mt-3">
            <button
              onClick={getCurrentLocation}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              title="Use Current Location"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              My Location
            </button>
            
            <button
              onClick={clearAllStops}
              disabled={stops.length === 0}
              className="flex items-center px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              title="Clear All Stops"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              Route ({stops.length} stops)
            </h3>
            {stops.length > 0 && (
              <button
                onClick={clearAllStops}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear All
              </button>
            )}
          </div>
          
          {stops.length > 0 ? (
            <div className="space-y-2 overflow-y-auto flex-1">
              {stops.map((stop, index) => (
                <div
                  key={stop.id}
                  className="flex items-center p-3 bg-gray-50 rounded border cursor-move hover:bg-gray-100"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    reorderStops(fromIndex, index);
                  }}
                >
                  <div className="flex-shrink-0 mr-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-red-500' : index === stops.length - 1 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {stop.label}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {stop.address}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-2">
                    <button
                      onClick={() => removeStop(stop.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove stop"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>No stops added yet</p>
                <p className="text-xs mt-1">Search or click on the map to add locations</p>
              </div>
            </div>
          )}
          
          {stops.length > 0 && (
            <div className="mt-3 text-xs text-gray-500 text-center">
              Drag to reorder • Click ✕ to remove
            </div>
          )}
        </div>
      </div>

     
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2">
          <div className="flex space-x-1">
            {(['roadmap', 'satellite', 'hybrid', 'terrain'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleMapTypeChange(type)}
                className={`px-2 py-1 text-xs rounded ${
                  mapType === type 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

       
        <div ref={mapRef} className="h-full w-full" />
      </div>
    </div>
  );
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
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Enhanced Route Planner</h3>
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
      </div>

      <div className="flex-1 relative">
        <Wrapper 
          libraries={['geometry', 'marker']} 
          render={render}
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        />
        
        {isOptimizing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-900 font-medium">Optimizing Route...</p>
              <p className="text-sm text-gray-600">This may take a few moments</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};