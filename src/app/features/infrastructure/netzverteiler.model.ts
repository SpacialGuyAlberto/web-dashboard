export interface Netzverteiler {
    id: number;
    identifier: string;
    latitude: number;
    longitude: number;
    popId: number;
    huepIds?: number[];
}
