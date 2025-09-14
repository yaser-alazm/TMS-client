import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {fetchWithAuth} from '@/lib/api'
import {
  VehicleFilterDto,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehiclesResponse,
} from '@yatms/common'
import {queryKeys} from '@/lib/query/queryKeys'

export function useVehicles(filters?: VehicleFilterDto) {
  return useQuery<VehiclesResponse>({
    queryKey: queryKeys.vehicles.list(filters),
    queryFn: async (): Promise<VehiclesResponse> => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, String(value))
          }
        })
      }

      const url = `/api/vehicles${params.toString() ? `?${params.toString()}` : ''}`
      return fetchWithAuth(url)
    },
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: () => fetchWithAuth(`/api/vehicles/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vehicleData: CreateVehicleDto) =>
      fetchWithAuth('/api/vehicles', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(vehicleData),
      }),
    onSuccess: () => {
      // Invalidate all vehicle lists
      queryClient.invalidateQueries({queryKey: queryKeys.vehicles.lists()})
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({id, data}: {id: string; data: UpdateVehicleDto}) =>
      fetchWithAuth(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      }),
    onSuccess: (_, {id}) => {
      // Invalidate specific vehicle and lists
      queryClient.invalidateQueries({queryKey: queryKeys.vehicles.detail(id)})
      queryClient.invalidateQueries({queryKey: queryKeys.vehicles.lists()})
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/vehicles/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({queryKey: queryKeys.vehicles.detail(id)})
      queryClient.invalidateQueries({queryKey: queryKeys.vehicles.lists()})
    },
  })
}
