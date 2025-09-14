'use client'

import {useVehicles, useDeleteVehicle} from '@/hooks/useVehicles'
import {Vehicle} from '@yatms/common'

export default function VehicleList() {
  const {data: vehiclesData, isLoading, error, refetch} = useVehicles()
  const deleteVehicleMutation = useDeleteVehicle()

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicleMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
        Error loading vehicles: {error.message}
        <button
          onClick={() => refetch()}
          className='ml-2 text-blue-500 underline'
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>Vehicles</h2>
        <button
          onClick={() => refetch()}
          className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Refresh
        </button>
      </div>

      {vehiclesData?.vehicles?.length === 0 ? (
        <p className='text-gray-500'>No vehicles found</p>
      ) : (
        <div className='grid gap-4'>
          {vehiclesData?.vehicles?.map((vehicle: Vehicle) => (
            <div
              key={vehicle.id}
              className='border rounded-lg p-4 bg-white shadow'
            >
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='font-semibold'>
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className='text-gray-600'>
                    License: {vehicle.licensePlate}
                  </p>
                  <p className='text-gray-600'>Status: {vehicle.status}</p>
                </div>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  disabled={deleteVehicleMutation.isPending}
                  className='text-red-500 hover:text-red-700 disabled:opacity-50'
                >
                  {deleteVehicleMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
