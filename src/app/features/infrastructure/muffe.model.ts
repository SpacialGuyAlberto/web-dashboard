export interface Muffe {
    id: number;
    type: string;
    latitude: number;
    longitude: number;
    spliceCount: number;
    isSealed: boolean;
    splicerSubcontractorId?: number;
}
