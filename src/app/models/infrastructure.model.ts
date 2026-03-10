export interface UtilityProvider {
    id: number;
    name: string;
    type: string;
    serviceRegion: string;
    contactEmail: string;
}

export interface Inquiry {
    id: number;
    projectId: number;
    utilityProvider: UtilityProvider;
    status: 'PENDING' | 'SENT' | 'RECEIVED_CLEAR' | 'RECEIVED_CONFLICT';
    requestDate?: string;
    responseFileUrl?: string;
    analysisResult?: string;
    analysisStatus?: 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED';
}
