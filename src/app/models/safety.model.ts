export interface SafetyProtocol {
    id?: number;
    segmentId: number;
    regelplanType: string;
    streetCategory: string;
    workType: string;
    requiredSigns: string;
    requiredBarriers: string;
    notes?: string;
    validated: boolean;
}

export interface TrafficPermit {
    id?: number;
    segmentId: number;
    permitNumber: string;
    issuingAuthority?: string;
    validFrom?: string;
    validTo?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    conditions?: string;
}

export interface Incident {
    id?: number;
    segmentId: number;
    type: 'BLOCKED' | 'WEATHER' | 'COMPLAINT' | 'SAFETY' | 'ACCIDENT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    reportedBy?: string;
    reportedAt?: string;
    photos?: string[];
}
