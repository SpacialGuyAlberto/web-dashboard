export interface GeometryPoint {
    lat: number;
    lng: number;
    z?: number;
}

export interface Segment {
    id?: number;
    projectId?: number;
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
    geometry?: GeometryPoint[];
    volume?: number;
    plannedStartDate?: string;
    plannedEndDate?: string;
    customFields?: { [key: string]: any };
}
