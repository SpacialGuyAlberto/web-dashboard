export interface GISFeature {
    id?: number;
    featureType: 'SEGMENT' | 'NODE' | 'MANHOLE' | 'CABINET' | 'SPLICE_POINT';
    geometry: any; // GeoJSON geometry object
    version: 'PLAN' | 'AS_BUILT' | 'CORRECTION';
    status: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
    properties?: any;
    segmentId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface TopologyValidation {
    connectivityErrors: string[];
    danglingSegments: string[];
    nodeErrors: string[];
    totalErrors: number;
}

export interface GISStats {
    planFeatures: number;
    asBuiltFeatures: number;
    correctionFeatures: number;
}
