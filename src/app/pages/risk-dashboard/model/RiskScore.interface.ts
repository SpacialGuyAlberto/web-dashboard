export interface RiskScore {
  id: number;
  segmentId: number;
  projectId: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;
  riskFactors: string; // Legacy
  predictedCompletion: string;
  bestCaseCompletion: string;
  worstCaseCompletion: string;
  delayProbability: number;

  // New Dimensions
  scheduleRisk: number;
  permitRisk: number;
  performanceRisk: number;
  safetyRisk: number;
  qualityRisk: number;
  environmentRisk: number;

  // Insights
  topCauses: string[];
  recommendedActions: string[]; // JSON strings
}
