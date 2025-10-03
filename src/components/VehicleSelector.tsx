'use client';

import React, { useEffect, useState } from 'react';
import { Vehicle } from '@yatms/common';
import { useBrowserVehicles } from '../hooks/useKafkaVehicles';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle) => void;
  onVehiclesLoad: (vehicles: Vehicle[]) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  selectedVehicle,
  onVehicleSelect,
  onVehiclesLoad,
}) => {
  const { vehicles, loading, error: kafkaError, refreshVehicles } = useBrowserVehicles();
  const [localError, setLocalError] = useState<string | null>(null);

  // Update parent component when vehicles change
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      onVehiclesLoad(vehicles);
    }
  }, [vehicles, onVehiclesLoad]);

  // Combine Kafka error with local errors
  const error = kafkaError || localError;

  const loadVehicles = async () => {
    try {
      await refreshVehicles();
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
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'retired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => onVehicleSelect(vehicle)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedVehicle?.id === vehicle.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getVehicleIcon(vehicle.type)}</div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicle.year} • {vehicle.registrationNumber}
                    </div>
                    <div className="text-sm text-gray-600">
                      📍 {vehicle.fuelType} • 👥 {vehicle.capacity} seats
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </div>
                  {selectedVehicle?.id === vehicle.id && (
                    <div className="mt-2 text-blue-600 text-sm">✓ Selected</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVehicle && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">
                {getVehicleIcon(selectedVehicle.type)} {selectedVehicle.make} {selectedVehicle.model}
              </div>
              <div className="text-sm text-blue-700">
                Capacity: {selectedVehicle.capacity} seats • Fuel: {selectedVehicle.fuelType}
              </div>
            </div>
            <button
              onClick={() => onVehicleSelect(null as any)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
