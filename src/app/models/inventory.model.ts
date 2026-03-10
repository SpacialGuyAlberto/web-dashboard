export interface Machine {
    id?: number;
    serialNumber: string;
    name: string;
    type: string;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'REPAIR_NEEDED' | 'DECOMMISSIONED';
    currentLocation?: string;
    assignedCrewId?: number;
}

export interface ProjectAllocation {
    projectId: string;
    projectName: string;
    quantityAllocated: number;
}

export interface Supplier {
    id?: number;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    type: 'MATERIAL' | 'MACHINERY' | 'BOTH';
}

export interface Material {
    id?: number;
    sku: string;
    name: string;
    unit: string;
    quantityOnHand: number;
    minThreshold: number;
    warehouseLocation?: string;

    // New Fields
    reorderMode: 'MANUAL' | 'AUTOMATIC';
    unitPrice?: number;
    supplier?: Supplier;
    projectAllocations?: ProjectAllocation[];
}
