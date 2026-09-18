export interface Netzverteiler {
    id: number;
    identifier: string;
    locationAddress?: string;
    latitude: number;
    longitude: number;
    popId: number;
    huepIds?: number[];
}
