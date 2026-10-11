import {GeometryPoint} from '@features/segments/segment.model';
import {Cluster} from '@features/clusters/cluster.model';

export enum WorkType {
    EXCAVATION = 'EXCAVATION',
    DUCT_INSTALLATION = 'DUCT_INSTALLATION',
    TRENCHING = 'TRENCHING',
    DRILLING = 'DRILLING',
    BACKFILL = 'BACKFILL',
    ASPHALT = 'ASPHALT',
    QA = 'QA',
    DUCT_LAYING = 'DUCT_LAYING',
    FIBER_BLOWING = 'FIBER_BLOWING',
    SPLICING = 'SPLICING',
    RESTORATION = 'RESTORATION',
    DOCUMENTATION = 'DOCUMENTATION'
}

export interface Project {
    id?: number;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    geometry?: GeometryPoint[];
    organizationId?: number;
    clusters?: Cluster[];
    lifecycle_todo?: WorkType[];
    lifecycle_done?: WorkType[];
    latitude?: number;
    longitude?: number;
    startLatitude?: number;
    startLongitude?: number;
}
