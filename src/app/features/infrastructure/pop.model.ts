export interface Pop {
    id: number;
    identifier?: string;
    name: string;
    locationAddress: string;
    latitude?: number;
    longitude?: number;
    elevation?: number;
    maxCapacityPorts: number;
    clusterId?: number;
    nvtIds?: number[];
}
