export interface ProgressTimePoint {
    label: string;
    date: string;
    segmentsCompleted: number;
    metersCompleted: number;
    activeCrews: number;
    completionRate: number;
}

export interface ProgressSummary {
    totalSegmentsCompleted: number;
    totalMetersCompleted: number;
    averageCompletionRate: number;
    totalActiveCrews: number;
}

export interface ProgressData {
    period: string;
    dataPoints: ProgressTimePoint[];
    summary: ProgressSummary;
}

export interface OverallProgress {
    totalMetersPlanned: number;
    totalMetersCompleted: number;
    overallProgressPercentage: number;
    progressByWorkType: { [key: string]: number };
    segmentsFullyCompleted: number;
    forecastedCompletionPercentage: number;
    dailyProductionMeters: number;
    dailyTargetMeters: number;
}

export interface CrewProductivity {
    crewId: number;
    crewName: string;
    metersPerDay: number;
    energyIndex: number;
}

export interface CrewRanking {
    crewName: string;
    score: number;
    metric: string;
}

export interface Productivity {
    crewProductivity: CrewProductivity[];
    topCrews: CrewRanking[];
    bottomCrews: CrewRanking[];
    averageMetersPerDayLast7Days: number;
    efficiencyOutputPerWorker: number;
    absenteeismRate: number;
}

export interface AreaPerformance {
    areaName: string;
    metersPerDay: number;
    totalMetersCompleted: number;
    trafficImpactScore: number;
    soilType: string;
    delayCluster: boolean;
}

export interface WeeklyTrend {
    weekLabel: string;
    metersCompleted: number;
}

export interface SCurvePoint {
    date: string;
    plannedCumulative: number;
    realCumulative: number;
    predictedCumulative: number;
}

export interface HistoricalTrends {
    weeklyProduction: WeeklyTrend[];
    sCurve: SCurvePoint[];
    productivityDecayIndex: number;
}

export interface QualityMetrics {
    defectRate: number;
    reworkHours: number;
    firstTimeRightScore: number;
    safetyComplianceScore: number;
    costInefficiencyEstimator: number;
}

export interface AdvancedProgressData {
    overall: OverallProgress;
    productivity: Productivity;
    areaPerformance: AreaPerformance[];
    trends: HistoricalTrends;
    quality: QualityMetrics;
}
