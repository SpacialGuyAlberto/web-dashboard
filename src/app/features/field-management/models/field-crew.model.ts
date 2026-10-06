export interface FieldCrew {
  id: number;
  name: string;
  leader: string;
  members: number;
  currentProject: string;
  status: string;
  location: string;
  
  // Extra metrics
  company?: string;
  correctionAvg?: number;
  finishedSegments?: number;
  materialAvg?: number;
  hoursWorked?: number;
  safetyScore?: number;
  clusterId?: number;
  projectId?: number;
}
