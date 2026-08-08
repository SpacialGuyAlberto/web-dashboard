export interface RiskScore {
    id: number;
    segmentId: number;
    projectId: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    confidenceScore: number;
    riskFactors?: string;
    predictedCompletion?: string;
    bestCaseCompletion?: string;
    worstCaseCompletion?: string;
    delayProbability: number;

    // New Dimension scores
    scheduleRisk: number;
    permitRisk: number;
    performanceRisk: number;
    safetyRisk: number;
    qualityRisk: number;
    environmentRisk: number;

    // Required for templates
    score: number;

    // Optional fields from prediction.service
    segmentName?: string;
    factors?: any;

    // Insights
    topCauses: string[];
    recommendedActions: string[];
}

export interface ProjectRisk {
    projectId: number;
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    averageRiskScore: number;
    segmentsAtRisk: number;
    totalSegments: number;
    predictedDelayDays: number;
    segmentSummary: {
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
        totalSegments: number;
    };
}
