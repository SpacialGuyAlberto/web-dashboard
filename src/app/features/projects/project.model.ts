import {GeometryPoint} from '@features/segments/segment.model';

export interface Project {
    id?: number;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    geometry?: GeometryPoint[];
}
