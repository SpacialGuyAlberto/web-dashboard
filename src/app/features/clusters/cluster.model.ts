export interface Cluster {
  id?: number;
  name: string;
  description?: string;
  projectId: number;
  projectManagerId?: number;
  pops?: any[];
}
