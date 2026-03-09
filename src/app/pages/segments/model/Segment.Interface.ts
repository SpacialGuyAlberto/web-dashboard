export interface Segment {
  id?: number;
  projectId: number;
  workType: string;
  geometry?: any;
  length?: number;
  streetName?: string;
  currentState?: string;
  assignedCrew?: any;
}
