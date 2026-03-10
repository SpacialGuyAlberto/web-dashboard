export interface RouteCoordinate {
    lat: number;
    lng: number;
}

export interface OSRMResponse {
    code: string;
    routes: {
        geometry: {
            type: string;
            coordinates: number[][];
        };
        distance: number;
        duration: number;
    }[];
}
