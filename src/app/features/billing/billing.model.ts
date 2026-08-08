export interface WorkLog {
    id?: number;
    segmentId: number;
    crewId: number;
    date: string;
    metersCompleted: number;
    hoursWorked: number;
    crossingsCompleted: number;
    reworkMeters: number;
    notes?: string;
}

export interface WorkLogDTO {
    id: number;
    segmentId: number;
    segmentName: string;
    crewId: number;
    crewName: string;
    subcontractorId: number;
    subcontractorName: string;
    date: string;
    metersCompleted: number;
    hoursWorked: number;
    crossingsCompleted: number;
    reworkMeters: number;
    notes?: string;
}

export interface BillingUnit {
    id?: number;
    subcontractorId: number;
    pricePerMeter: number;
    pricePerCrossing: number;
    pricePerManHour: number;
    effectiveFrom: string;
    effectiveTo?: string;
}

export interface BillingReport {
    subcontractorId: number;
    subcontractorName: string;
    totalMeters: number;
    totalHours: number;
    totalCrossings: number;
    totalReworkMeters: number;
    pricePerMeter: number;
    pricePerCrossing: number;
    pricePerManHour: number;
    meterCost: number;
    hourCost: number;
    crossingCost: number;
    totalAmount: number;
}
