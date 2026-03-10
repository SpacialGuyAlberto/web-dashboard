export interface DashboardStats {
    overallProgress: number;
    highRiskSegments: number;
    highRiskTrend: number;
    predictedDelayDays: number;
    dailyProduction: number;
    dailyProductionTarget: number;
    openIncidents: number;
    criticalIncidents: number;
    pendingPermits: number;
    avgPermitWaitDays: number;
}
