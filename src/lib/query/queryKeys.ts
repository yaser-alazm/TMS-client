import {VehicleFilterDto} from '@yatms/common'

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    check: ['auth', 'check'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: string) =>
      [...queryKeys.users.lists(), {filters}] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    list: (filters?: VehicleFilterDto) =>
      [...queryKeys.vehicles.lists(), {filters}] as const,
    details: () => [...queryKeys.vehicles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
  },
} as const
