export interface Huep {
    id: number;
    identifier?: string;
    streetAddress: string;
    houseNumber?: string;
    latitude?: number;
    longitude?: number;
    installationLocation?: string;
    status: string;
    netzverteilerId?: number;
}
