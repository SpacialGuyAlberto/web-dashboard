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

@Component({
    selector: 'app-schedule',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit, OnChanges {
    // Data
    assignments: CrewAssignment[] = [];
    crews: Crew[] = [];
    projects: Project[] = [];
    segments: Segment[] = [];

    // Filters
    @Input() selectedCrewId: number | null = null;
    @Input() selectedProjectId: number | null = null;
    @Input() isEmbedded: boolean = false;
    @Input() segmentsForCrew: Segment[] = [];

    // Week navigation
    currentWeekStart: Date = new Date();
    weekDays: Date[] = [];

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

    constructor(
        private scheduleService: ScheduleService,
        private subcontractorService: SubcontractorService,
        private planningService: PlanningService,
        private segmentService: SegmentService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.initializeWeek();
        this.loadCrews();
        if (!this.isEmbedded) {
            this.loadProjects();
            this.loadWeekSchedule();
        } else {
            this.mapSegmentsToAssignments();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['segmentsForCrew'] && this.isEmbedded) {
            this.mapSegmentsToAssignments();
        }
        if (changes['selectedCrewId'] && !changes['selectedCrewId'].firstChange) {
            if (!this.isEmbedded) {
                this.loadWeekSchedule();
            }
        }
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
            
            // Loop through each day from start to end and create a mock assignment for the grid
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

    // Initialize week dates (Monday to Sunday)
    initializeWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday

        this.currentWeekStart = new Date(today);
        this.currentWeekStart.setDate(today.getDate() + diff);
        this.currentWeekStart.setHours(0, 0, 0, 0);

        this.weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(this.currentWeekStart);
            day.setDate(this.currentWeekStart.getDate() + i);
            this.weekDays.push(day);
        }
    }

    // Navigate week
    previousWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.initializeWeek();
        this.loadWeekSchedule();
    }

    nextWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.initializeWeek();
        this.loadWeekSchedule();
    }

    onDateSelected(dateStr: string) {
        if (!dateStr) return;
        const selectedDate = new Date(dateStr);
        // Adjust to Monday
        const dayOfWeek = selectedDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        this.currentWeekStart = new Date(selectedDate);
        this.currentWeekStart.setDate(selectedDate.getDate() + diff);
        this.currentWeekStart.setHours(0, 0, 0, 0);

        this.initializeWeek();
        this.loadWeekSchedule();
    }

    // Load data
    loadCrews() {
        this.subcontractorService.getAllCrews().subscribe((crews: Crew[]) => {
            this.crews = crews;
            this.cdr.detectChanges();
        });
    }

    loadProjects() {
        this.planningService.getProjects().subscribe((projects: Project[]) => {
            this.projects = projects;
            this.cdr.detectChanges();
        });
    }

    loadWeekSchedule() {
        const start = this.formatDate(this.weekDays[0]);
        const end = this.formatDate(this.weekDays[6]);

        this.scheduleService.getWeekSchedule(start, end).subscribe((assignments: CrewAssignment[]) => {
            this.assignments = assignments;
            this.cdr.detectChanges();
        });
    }

    // Get assignments for a specific crew and date
    getAssignment(crewId: number, date: Date): CrewAssignment | null {
        const dateStr = this.formatDate(date);
        return this.assignments.find(a =>
            a.crewId === crewId && a.assignedDate === dateStr
        ) || null;
    }

    // Open assignment modal
    openAssignModal(crewId: number, date: Date) {
        this.newAssignment = {
            crewId: crewId,
            segmentId: 0,
            assignedDate: this.formatDate(date),
            status: 'SCHEDULED'
        };

        // Load segments for selected project
        if (this.selectedProjectId) {
            this.segmentService.getProjectSegments(this.selectedProjectId).subscribe((segments: Segment[]) => {
                this.segments = segments;
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
                this.loadWeekSchedule();
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
                this.loadWeekSchedule();
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

    // Filter crews
    get filteredCrews(): Crew[] {
        if (this.selectedCrewId) {
            return this.crews.filter((c: Crew) => c.id === this.selectedCrewId);
        }
        return this.crews;
    }
}
