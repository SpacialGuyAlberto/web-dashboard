import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../../services/schedule.service';
import { CrewAssignment } from '../../models/schedule.model';
import { SubcontractorService } from '../../services/subcontractor.service';
import { Crew } from '../../models/subcontractor.model';
import { PlanningService } from '../../services/planning.service';
import { SegmentService } from '../../services/segment.service';
import { Segment } from '../../models/segment.model';
import { Project } from '../../models/project.model';

@Component({
    selector: 'app-schedule',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
    // Data
    assignments: CrewAssignment[] = [];
    crews: Crew[] = [];
    projects: Project[] = [];
    segments: Segment[] = [];

    // Filters
    selectedCrewId: number | null = null;
    selectedProjectId: number | null = null;

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
        this.loadProjects();
        this.loadWeekSchedule();
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
            case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
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
