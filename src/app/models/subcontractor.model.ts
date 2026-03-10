export interface Subcontractor {
    id?: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    rating?: number;
    status: 'PREFERRED' | 'ACTIVE' | 'BLOCKED';
    skills: string[];
    certifications?: string[];
    averageTimePerMeter?: number;
    defectRate?: number;
    reworkFrequency?: number;
}

export interface Crew {
    id?: number;
    name: string;
    subcontractor?: Subcontractor;
    foremanName: string;
    size: number;
    vehiclePlate: string;
}
