import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

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

// Advanced Progress Interfaces
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

@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    // Session Key
    private readonly PROGRESS_KEY = 'mock_advanced_progress_data';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (!sessionStorage.getItem(this.PROGRESS_KEY)) {
            const mockData: AdvancedProgressData = {
                overall: {
                    totalMetersPlanned: 15000,
                    totalMetersCompleted: 4500,
                    overallProgressPercentage: 30,
                    progressByWorkType: {
                        'Excavation': 45,
                        'Piping': 25,
                        'Backfill': 15,
                        'Paving': 5
                    },
                    segmentsFullyCompleted: 12,
                    forecastedCompletionPercentage: 85,
                    dailyProductionMeters: 350,
                    dailyTargetMeters: 400
                },
                productivity: {
                    crewProductivity: [
                        { crewId: 101, crewName: 'Alpha Crew', metersPerDay: 120, energyIndex: 95 },
                        { crewId: 102, crewName: 'Beta Crew', metersPerDay: 95, energyIndex: 88 },
                        { crewId: 103, crewName: 'Gamma Crew', metersPerDay: 150, energyIndex: 92 }
                    ],
                    topCrews: [
                        { crewName: 'Gamma Crew', score: 9.5, metric: 'Efficiency' },
                        { crewName: 'Alpha Crew', score: 9.0, metric: 'Speed' }
                    ],
                    bottomCrews: [
                        { crewName: 'Beta Crew', score: 6.5, metric: 'Consistency' }
                    ],
                    averageMetersPerDayLast7Days: 320,
                    efficiencyOutputPerWorker: 12.5,
                    absenteeismRate: 2.5
                },
                areaPerformance: [
                    { areaName: 'North Sector', metersPerDay: 150, totalMetersCompleted: 2000, trafficImpactScore: 3, soilType: 'SANDY', delayCluster: false },
                    { areaName: 'Downtown', metersPerDay: 50, totalMetersCompleted: 800, trafficImpactScore: 9, soilType: 'ROCKY', delayCluster: true },
                    { areaName: 'Industrial Zone', metersPerDay: 180, totalMetersCompleted: 1700, trafficImpactScore: 2, soilType: 'CLAY', delayCluster: false }
                ],
                trends: {
                    weeklyProduction: [
                        { weekLabel: 'Week 1', metersCompleted: 500 },
                        { weekLabel: 'Week 2', metersCompleted: 750 },
                        { weekLabel: 'Week 3', metersCompleted: 1200 },
                        { weekLabel: 'Week 4', metersCompleted: 1500 }
                    ],
                    sCurve: [
                        { date: '2025-01-01', plannedCumulative: 0, realCumulative: 0, predictedCumulative: 0 },
                        { date: '2025-01-08', plannedCumulative: 500, realCumulative: 450, predictedCumulative: 500 },
                        { date: '2025-01-15', plannedCumulative: 1200, realCumulative: 1100, predictedCumulative: 1150 },
                        { date: '2025-01-22', plannedCumulative: 2000, realCumulative: 2100, predictedCumulative: 2200 },
                        { date: '2025-02-01', plannedCumulative: 3000, realCumulative: 3500, predictedCumulative: 3600 }
                    ],
                    productivityDecayIndex: 0.98
                },
                quality: {
                    defectRate: 1.5,
                    reworkHours: 12,
                    firstTimeRightScore: 94,
                    safetyComplianceScore: 99,
                    costInefficiencyEstimator: 5.2
                }
            };
            sessionStorage.setItem(this.PROGRESS_KEY, JSON.stringify(mockData));
        }
    }

    private getMockData(): AdvancedProgressData {
        const data = sessionStorage.getItem(this.PROGRESS_KEY);
        // Fallback to avoid error if cleared
        return data ? JSON.parse(data) : {} as AdvancedProgressData;
    }

    getDailyProgress(days: number = 30): Observable<ProgressData> {
        // Mock simple daily data derived from advanced or static
        return of({
            period: 'Daily',
            dataPoints: [],
            summary: {
                totalSegmentsCompleted: 12,
                totalMetersCompleted: 4500,
                averageCompletionRate: 0.35,
                totalActiveCrews: 3
            }
        });
    }

    getWeeklyProgress(weeks: number = 12): Observable<ProgressData> {
        return of({
            period: 'Weekly',
            dataPoints: [],
            summary: {
                totalSegmentsCompleted: 12,
                totalMetersCompleted: 4500,
                averageCompletionRate: 0.35,
                totalActiveCrews: 3
            }
        });
    }

    getMonthlyProgress(months: number = 6): Observable<ProgressData> {
        return of({
            period: 'Monthly',
            dataPoints: [],
            summary: {
                totalSegmentsCompleted: 12,
                totalMetersCompleted: 4500,
                averageCompletionRate: 0.35,
                totalActiveCrews: 3
            }
        });
    }

    getAdvancedProgress(startDate?: string, endDate?: string): Observable<AdvancedProgressData> {
        return of(this.getMockData());
    }
}
