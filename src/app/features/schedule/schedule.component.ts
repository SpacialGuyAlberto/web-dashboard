import { Component, OnInit, ChangeDetectorRef, Input, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from './schedule.service';
import { CrewAssignment } from './schedule.model';
import { SubcontractorService } from '@features/field-management/subcontractor.service';
import { Crew } from '@features/field-management/subcontractor.model';
import { PlanningService } from '@features/risk-planning/planning.service';
import { SegmentService } from '@features/segments/segment.service';
import { Segment } from '@features/segments/segment.model';
import { Project } from '@features/projects/project.model';

export interface CalendarDayCell {
    date: Date;
    isCurrentMonth: boolean;
    dayNumber: number;
}

export interface CalendarWeek {
    weekNumber: number;
    days: CalendarDayCell[];
}

@Component({
    selector: 'app-schedule',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit, OnChanges {
    // View mode
    viewMode: 'Weekly' | 'Monthly' = 'Weekly';
    monthViewType: 'calendar' | 'matrix' = 'calendar'; // 'calendar' (selected team full month grid) or 'matrix' (all teams horizontal timeline)
    timelineDensity: 'spacious' | 'compact' = 'spacious';
    timePeriods: string[] = ['Weekly', 'Monthly'];

    // Data
    assignments: CrewAssignment[] = [];
    crews: Crew[] = [];
    projects: Project[] = [];
    segments: Segment[] = [];
    crewSegments: Segment[] = [];

    // Filters
    @Input() selectedCrewId: number | null = null;
    @Input() selectedProjectId: number | null = null;
    @Input() isEmbedded: boolean = false;
    @Input() segmentsForCrew: Segment[] = [];

    // Navigation dates
    currentWeekStart: Date = new Date();
    currentMonthStart: Date = new Date();
    weekDays: Date[] = [];
    monthDays: Date[] = [];
    monthCalendarDays: CalendarDayCell[] = [];
    monthWeeks: CalendarWeek[] = [];
    today: Date = new Date();

    // Modal state
    showAssignModal = false;
    validationErrors: string[] = [];

    // New assignment
    newAssignment: CrewAssignment = {
        crewId: 0,
        segmentId: 0,
        assignedDate: '',
        status: 'SCHEDULED'
    };

    weekdayNames: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    constructor(
        private scheduleService: ScheduleService,
        private subcontractorService: SubcontractorService,
        private planningService: PlanningService,
        private segmentService: SegmentService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.initializeWeek();
        this.initializeMonth();
        this.loadCrews();
        if (!this.isEmbedded) {
            this.loadProjects();
            this.loadSchedule();
        } else {
            this.mapSegmentsToAssignments();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        this.mapSegmentsToAssignments();
        if (changes['segmentsForCrew'] && this.isEmbedded) {
            this.mapSegmentsToAssignments();
        }
        if (changes['selectedCrewId'] && !changes['selectedCrewId'].firstChange) {
            if (!this.isEmbedded) {
                this.loadSchedule();
            }
        }
    }

    // Initialize week dates (Monday to Sunday)
    initializeWeek() {
        const d = new Date(this.currentWeekStart);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        this.currentWeekStart = new Date(d.setDate(diff));
        this.currentWeekStart.setHours(0, 0, 0, 0);

        this.weekDays = [];
        for (let i = 0; i < 7; i++) {
            const weekDay = new Date(this.currentWeekStart);
            weekDay.setDate(this.currentWeekStart.getDate() + i);
            this.weekDays.push(weekDay);
        }
    }

    // Initialize full month dates (1..N and calendar grid)
    initializeMonth() {
        const year = this.currentMonthStart.getFullYear();
        const month = this.currentMonthStart.getMonth();

        // 1. All days of the actual month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        this.monthDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
            this.monthDays.push(new Date(year, month, d, 0, 0, 0));
        }

        // 2. 7-column calendar grid (Mon-Sun)
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
        const prevMonthDays = new Date(year, month, 0).getDate();

        this.monthCalendarDays = [];

        // Previous month padding
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const prevDate = new Date(year, month - 1, prevMonthDays - i);
            this.monthCalendarDays.push({
                date: prevDate,
                isCurrentMonth: false,
                dayNumber: prevDate.getDate()
            });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const currDate = new Date(year, month, d);
            this.monthCalendarDays.push({
                date: currDate,
                isCurrentMonth: true,
                dayNumber: d
            });
        }

        // Next month padding to complete row of 7
        const remaining = (7 - (this.monthCalendarDays.length % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            const nextDate = new Date(year, month + 1, i);
            this.monthCalendarDays.push({
                date: nextDate,
                isCurrentMonth: false,
                dayNumber: i
            });
        }

        // 3. Group days into calendar weeks (KW / CW)
        this.monthWeeks = [];
        for (let i = 0; i < this.monthCalendarDays.length; i += 7) {
            const weekDays = this.monthCalendarDays.slice(i, i + 7);
            const midDate = weekDays[3] ? weekDays[3].date : weekDays[0].date;
            this.monthWeeks.push({
                weekNumber: this.getWeekNumber(midDate),
                days: weekDays
            });
        }
    }

    getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    // Navigation methods
    previousPeriod() {
        if (this.viewMode === 'Weekly') {
            this.previousWeek();
        } else {
            this.previousMonth();
        }
    }

    nextPeriod() {
        if (this.viewMode === 'Weekly') {
            this.nextWeek();
        } else {
            this.nextMonth();
        }
    }

    previousWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.initializeWeek();
        this.loadSchedule();
    }

    nextWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.initializeWeek();
        this.loadSchedule();
    }

    previousMonth() {
        this.currentMonthStart = new Date(
            this.currentMonthStart.getFullYear(),
            this.currentMonthStart.getMonth() - 1,
            1
        );
        this.initializeMonth();
        this.loadSchedule();
    }

    nextMonth() {
        this.currentMonthStart = new Date(
            this.currentMonthStart.getFullYear(),
            this.currentMonthStart.getMonth() + 1,
            1
        );
        this.initializeMonth();
        this.loadSchedule();
    }

    goToToday() {
        this.currentWeekStart = new Date();
        this.currentMonthStart = new Date();
        this.initializeWeek();
        this.initializeMonth();
        this.loadSchedule();
    }

    setViewMode(mode: 'Weekly' | 'Monthly') {
        this.viewMode = mode;
        this.loadSchedule();
    }

    setMonthViewType(type: 'calendar' | 'matrix') {
        this.monthViewType = type;
    }

    setTimelineDensity(density: 'spacious' | 'compact') {
        this.timelineDensity = density;
    }

    selectCrew(crewId: number | null | undefined) {
        this.selectedCrewId = crewId ?? null;
        this.loadSchedule();
    }

    get activeCrew(): Crew | null {
        if (this.selectedCrewId) {
            return this.crews.find(c => c.id === this.selectedCrewId) || null;
        }
        return this.crews.length > 0 ? this.crews[0] : null;
    }

    onDateSelected(dateStr: string) {
        if (!dateStr) return;
        const selectedDate = new Date(dateStr);
        this.currentWeekStart = new Date(selectedDate);
        this.currentMonthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        this.initializeWeek();
        this.initializeMonth();
        this.loadSchedule();
    }

    // Load data
    loadCrews() {
        this.subcontractorService.getAllCrews().subscribe((crews: Crew[]) => {
            this.crews = crews;
            if (!this.selectedCrewId && this.crews.length > 0) {
                this.selectedCrewId = this.crews[0].id || null;
            }
            this.cdr.detectChanges();
        });
    }

    loadProjects() {
        this.planningService.getProjects().subscribe((projects: Project[]) => {
            this.projects = projects;
            this.cdr.detectChanges();
        });
    }

    loadSchedule() {
        if (this.viewMode === 'Weekly') {
            this.loadWeekSchedule();
        } else {
            this.loadMonthSchedule();
        }
    }

    loadWeekSchedule() {
        if (!this.weekDays || this.weekDays.length === 0) {
            this.initializeWeek();
        }
        const start = this.formatDate(this.weekDays[0]);
        const end = this.formatDate(this.weekDays[6]);

        this.loadCrewSegments();
        this.fetchAssignments(start, end);
    }

    loadMonthSchedule() {
        if (!this.monthDays || this.monthDays.length === 0) {
            this.initializeMonth();
        }
        const start = this.formatDate(this.monthDays[0]);
        const end = this.formatDate(this.monthDays[this.monthDays.length - 1]);

        this.loadCrewSegments();
        this.fetchAssignments(start, end);
    }

    private loadCrewSegments() {
        this.segmentService.getCrewSchedule(this.selectedCrewId).subscribe({
            next: (segments: Segment[]) => {
                this.crewSegments = segments || [];
                this.segmentsForCrew = segments || [];
                this.cdr.detectChanges();
            },
            error: (err) => console.warn('Could not fetch crew segments:', err)
        });
    }

    private fetchAssignments(start: string, end: string) {
        this.scheduleService.getSchedule({
            crewId: this.selectedCrewId,
            projectId: this.selectedProjectId,
            start,
            end
        }).subscribe({
            next: (assignments: CrewAssignment[]) => {
                this.assignments = assignments || [];
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.warn('Could not load schedule from backend, falling back to segment mapping', err);
                this.mapSegmentsToAssignments();
            }
        });
    }

    private mapSegmentsToAssignments() {
        if (!this.segmentsForCrew || this.segmentsForCrew.length === 0) {
            this.assignments = [];
            return;
        }

        const newAssignments: CrewAssignment[] = [];
        for (const seg of this.segmentsForCrew) {
            if (!seg.plannedStartDate || !seg.plannedEndDate) continue;

            const start = new Date(seg.plannedStartDate);
            const end = new Date(seg.plannedEndDate);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
                const segStatus = seg.currentState || 'SCHEDULED';
                const statusType = validStatuses.includes(segStatus) ? segStatus : 'SCHEDULED';

                newAssignments.push({
                    id: seg.id,
                    crewId: seg.assignedCrewId || 0,
                    segmentId: seg.id || 0,
                    segmentName: seg.streetName || `Segment #${seg.id}`,
                    assignedDate: this.formatDate(d),
                    status: statusType as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
                    notes: `${seg.workType} from ${seg.plannedStartDate} to ${seg.plannedEndDate}`
                });
            }
        }

        this.assignments = newAssignments;
        this.cdr.detectChanges();
    }

    // Get assignment for a specific crew and date
    getAssignment(crewId: number, date: Date): CrewAssignment | null {
        const dateStr = this.formatDate(date);
        return this.assignments.find(a =>
            a.crewId === crewId && a.assignedDate === dateStr
        ) || null;
    }

    getAssignments(crewId: number, date: Date): CrewAssignment[] {
        const dateStr = this.formatDate(date);
        return this.assignments.filter(a =>
            a.crewId === crewId && a.assignedDate === dateStr
        );
    }

    // Month statistics per team
    getCrewMonthAssignments(crewId: number | undefined): CrewAssignment[] {
        if (!crewId) return [];
        return this.assignments.filter(a => a.crewId === crewId);
    }

    getCrewMonthAssignedDaysCount(crewId: number | undefined): number {
        if (!crewId) return 0;
        const dates = new Set(
            this.assignments
                .filter(a => a.crewId === crewId && a.status !== 'CANCELLED')
                .map(a => a.assignedDate)
        );
        return dates.size;
    }

    getCrewMonthUtilization(crewId: number | undefined): number {
        if (!crewId || !this.monthDays || this.monthDays.length === 0) return 0;
        const assigned = this.getCrewMonthAssignedDaysCount(crewId);
        return Math.min(100, Math.round((assigned / this.monthDays.length) * 100));
    }

    getCrewStatusCount(crewId: number | undefined, status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'): number {
        if (!crewId) return 0;
        return this.assignments.filter(a => a.crewId === crewId && a.status === status).length;
    }

    isTodayDate(day: Date): boolean {
        return this.today.getDate() === day.getDate() &&
               this.today.getMonth() === day.getMonth() &&
               this.today.getFullYear() === day.getFullYear();
    }

    isWeekend(day: Date): boolean {
        const d = day.getDay();
        return d === 0 || d === 6; // Sunday or Saturday
    }

    // Open assignment modal
    openAssignModal(crewId: number, date: Date) {
        this.newAssignment = {
            crewId: crewId,
            segmentId: 0,
            assignedDate: this.formatDate(date),
            status: 'SCHEDULED'
        };

        // Load segments for selected project (or first project if no filter active)
        const projId = this.selectedProjectId || (this.projects && this.projects.length > 0 ? this.projects[0].id : null);
        if (projId) {
            this.segmentService.getProjectSegments(projId).subscribe((segments: Segment[]) => {
                this.segments = segments || [];
                this.cdr.detectChanges();
            });
        }

        this.validationErrors = [];
        this.showAssignModal = true;
    }

    closeAssignModal() {
        this.showAssignModal = false;
        this.validationErrors = [];
    }

    // Save assignment
    saveAssignment() {
        this.scheduleService.createAssignment(this.newAssignment).subscribe({
            next: () => {
                this.loadSchedule();
                this.closeAssignModal();
            },
            error: (err: any) => {
                if (err.error && err.error.error) {
                    this.validationErrors = [err.error.error];
                } else {
                    this.validationErrors = ['Failed to create assignment'];
                }
            }
        });
    }

    // Delete assignment
    deleteAssignment(assignmentId: number | undefined) {
        if (!assignmentId) return;

        if (confirm('Are you sure you want to delete this assignment?')) {
            this.scheduleService.deleteAssignment(assignmentId).subscribe(() => {
                this.loadSchedule();
            });
        }
    }

    // Format date to ISO string (YYYY-MM-DD)
    formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    // Get day name
    getDayName(date: Date): string {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    assertDateFormatting(day: Date): string {
        if (this.isTodayDate(day)) {
            return 'relative bg-[#2fb080]/10 p-2 border-r border-white/5 last:border-r-0 min-h-[120px] cursor-pointer transition-colors hover:bg-white/5';
        }
        if (this.isDateInAssignement(day)) {
            return 'relative bg-[#5D3140]/10 p-2 border-r border-white/5 last:border-r-0 min-h-[120px] cursor-pointer transition-colors hover:bg-white/5';
        }
        return 'relative p-2 border-r border-white/5 last:border-r-0 min-h-[120px] cursor-pointer transition-colors hover:bg-white/5';
    }

    isDateInAssignement(date: Date): boolean {
        return this.crewSegments.some(s => {
            if (s.plannedStartDate && s.plannedEndDate) {
                const startDate = new Date(s.plannedStartDate);
                const endDate = new Date(s.plannedEndDate);
                return date >= startDate && date <= endDate;
            }
            return false;
        });
    }

    // Get status color
    getStatusColor(status: string): string {
        switch (status) {
            case 'SCHEDULED': return 'border-l-2 border-l-[#6938ef] bg-[#161719] text-white/90 border-y-white/5 border-r-white/5 border-y border-r';
            case 'IN_PROGRESS': return 'border-l-2 border-l-amber-400 bg-[#161719] text-white/90 border-y-white/5 border-r-white/5 border-y border-r';
            case 'COMPLETED': return 'border-l-2 border-l-[#2fb080] bg-[#161719] text-white/90 border-y-white/5 border-r-white/5 border-y border-r';
            case 'CANCELLED': return 'border-l-2 border-l-red-400 bg-[#161719] text-white/90 border-y-white/5 border-r-white/5 border-y border-r';
            default: return 'border-l-2 border-l-white/20 bg-[#161719] text-white/90 border-y-white/5 border-r-white/5 border-y border-r';
        }
    }

    getCrewName(crewId: number): string {
        const c = this.crews.find(c => c.id === crewId);
        return c ? c.name : `Crew #${crewId}`;
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'SCHEDULED': return 'bg-[#6938ef]/15 text-[#9d7cf7] border border-[#6938ef]/30';
            case 'IN_PROGRESS': return 'bg-amber-400/15 text-amber-300 border border-amber-400/30';
            case 'COMPLETED': return 'bg-[#2fb080]/15 text-[#2fb080] border border-[#2fb080]/30';
            case 'CANCELLED': return 'bg-red-400/15 text-red-300 border border-red-400/30';
            default: return 'bg-white/10 text-white/70 border border-white/10';
        }
    }

    // Filter crews
    get filteredCrews(): Crew[] {
        if (this.selectedCrewId) {
            return this.crews.filter((c: Crew) => c.id === this.selectedCrewId);
        }
        return this.crews;
    }
}
