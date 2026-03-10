export interface Evidence {
    id?: number;
    segmentId: number;
    stepName: string;
    photoUrl: string;
    latitude?: number;
    longitude?: number;
    createdAt?: string;
    userId?: string;
}

export interface FieldCrew {
    id: number;
    name: string;
    leader: string;
    members: number;
    currentProject: string;
    status: string;
    location: string;
}
