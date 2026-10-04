export interface GeometryPoint {
  lat: number;
  lng: number;
  elevation?: number;
}

export interface UtilityLine {
  id?: number;
  utilityType: 'AGUA' | 'GAS' | 'ELECTRICIDAD';
  geometry: GeometryPoint[];
  depth?: number;
  operatorName?: string;
  contactPhone?: string;
  hazardLevel?: string;
  status?: string;
}
