export interface GeometryPoint {
    lat: number;
    lng: number;
    z?: number;
}

export interface Segment {
    id?: number;
    startNvtId?: number;
    endNvtId?: number;
    connectedPopId?: number;
    assignedCrew?: number;
    assignedCrewId?: number;
    streetName: string;
    streetType: string;
    workType: string;
    currentState: string;
    length: number;
    startLatitude?: number;
    startLongitude?: number;
    endLatitude?: number;
    endLongitude?: number;
    startAddress?: string;
    endAddress?: string;
    geometry?: GeometryPoint[];
    volume?: number;
    plannedStartDate?: string;
    plannedEndDate?: string;
    customFields?: { [key: string]: any };
}
