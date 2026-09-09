export interface Cluster {
  id?: number;
  projectId: number;
  name: string;
  cityArea: string;
  popCount: number;
  netzverteilerCount: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
}
