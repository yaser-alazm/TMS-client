'use client';

import React, { useEffect, useState } from 'react';
import { Vehicle } from '@yatms/common';
import { useVehicles } from '../hooks/useVehicles';

interface VehicleSelectorProps {
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle) => void;
  onVehiclesLoad: (vehicles: Vehicle[]) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicle,
  onVehicleSelect,
  onVehiclesLoad,
}) => {
  const { data: vehiclesResponse, isLoading: loading, error: vehicleError, refetch } = useVehicles();
  const [localError, setLocalError] = useState<string | null>(null);

  const vehicles = vehiclesResponse?.vehicles || [];

  // Update parent component when vehicles change
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      onVehiclesLoad(vehicles);
    }
  }, [vehicles, onVehiclesLoad]);

  const error = vehicleError?.message || localError;

  const loadVehicles = async () => {
    try {
      await refetch();
      setLocalError(null);
    } catch (err) {
      setLocalError(`Failed to load vehicles: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'car':
        return '🚗';
      case 'truck':
        return '🚛';
      case 'van':
        return '🚐';
      case 'motorcycle':
        return '🏍️';
      default:
        return '🚗';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600';
      case 'maintenance':
        return 'text-yellow-600';
      case 'rented':
        return 'text-blue-600';
      case 'retired':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleVehicleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = event.target.value;
    if (vehicleId === '') {
      return;
    }
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      onVehicleSelect(vehicle);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Vehicle</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading vehicles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Vehicle</h3>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={loadVehicles}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Vehicle</h3>
        <span className="text-sm text-gray-600">{vehicles.length} available</span>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <div className="text-4xl mb-2">🚗</div>
          <p>No vehicles available</p>
          <p className="text-sm">Contact your fleet manager</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="vehicle-select" className="block text-sm font-medium text-gray-700 mb-2">
              Choose a vehicle
            </label>
            <select
              id="vehicle-select"
              value={selectedVehicle?.id || ''}
              onChange={handleVehicleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {getVehicleIcon(vehicle.type)} {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.status}
                </option>
              ))}
            </select>
          </div>

          {selectedVehicle && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{getVehicleIcon(selectedVehicle.type)}</span>
                    <div>
                      <div className="font-semibold text-blue-900">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </div>
                      <div className="text-sm text-blue-700">
                        {selectedVehicle.year} • {selectedVehicle.registrationNumber}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                    <div>📍 {selectedVehicle.fuelType}</div>
                    <div>👥 {selectedVehicle.capacity} seats</div>
                    <div className={`font-medium ${getStatusColor(selectedVehicle.status)}`}>
                      Status: {selectedVehicle.status}
                    </div>
                    <div>🆔 {selectedVehicle.id.slice(0, 8)}...</div>
                  </div>
                </div>
                
                <button
                  onClick={() => onVehicleSelect(null as any)}
                  className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
