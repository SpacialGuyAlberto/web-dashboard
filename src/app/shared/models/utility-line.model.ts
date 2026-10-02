export interface GeometryPoint {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface UtilityLine {
  id?: number;
  utilityType: 'WATER' | 'GAS' | 'ELECTRICITY';
  geometry: GeometryPoint[];
  depth?: number;
  operatorName?: string;
  contactPhone?: string;
  hazardLevel?: string;
  status?: string;
}

export interface WaterPipe extends UtilityLine {
  utilityType: 'WATER';
  pipeType?: string;
  material?: string;
  diameterMm?: number;
  pressureLevel?: string;
}

export interface GasPipe extends UtilityLine {
  utilityType: 'GAS';
  pressureClass?: string;
  material?: string;
}

export interface ElectricityCable extends UtilityLine {
  utilityType: 'ELECTRICITY';
  voltageCategory?: string;
  voltageValue?: number;
  shieldingType?: string;
  numberOfCores?: number;
}
