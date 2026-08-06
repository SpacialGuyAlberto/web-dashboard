import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { WorkflowsComponent } from './pages/workflows/workflows.component';
import { FieldCrewsComponent } from './pages/field-crews/field-crews.component';
import { SegmentsComponent } from './pages/segments/segments';
import { SubcontractorsComponent } from './pages/subcontractors/subcontractors.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { WorkLogComponent } from './pages/work-log/work-log.component';
import { BillingReportComponent } from './pages/billing-report/billing-report.component';
import { GisViewerComponent } from './pages/gis-viewer/gis-viewer.component';


import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: '',
        // canActivate: [authGuard], // Disabled for Demo
        children: [
            { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'projects', component: ProjectsComponent },
            { path: 'segments', component: SegmentsComponent },
            { path: 'subcontractors', component: SubcontractorsComponent },
            { path: 'schedule', component: ScheduleComponent },
            { path: 'work-logs', component: WorkLogComponent },
            { path: 'billing-reports', component: BillingReportComponent },
            { path: 'gis-viewer', component: GisViewerComponent },
            { path: 'risk-dashboard', loadComponent: () => import('./pages/planning/risk-dashboard/risk-dashboard.component').then(m => m.RiskDashboardComponent) },
            { path: 'progress', loadComponent: () => import('./pages/progress/progress.component').then(m => m.ProgressComponent) },
            { path: 'workflows', component: WorkflowsComponent },
            { path: 'field-crews', component: FieldCrewsComponent },
            { path: 'config/fields', loadComponent: () => import('./pages/field-config/field-config.component').then(m => m.FieldConfigComponent) },
            { path: 'users/:id', loadComponent: () => import('./pages/user-detail/user-detail.component').then(m => m.UserDetailComponent) },
            { path: 'users', loadComponent: () => import('./pages/user-management/user-management.component').then(m => m.UserManagementComponent) },
            { path: 'inventory/machines', loadComponent: () => import('./pages/inventory/machinery-list/machinery-list.component').then(m => m.MachineryListComponent) },
            { path: 'inventory/materials', loadComponent: () => import('./pages/inventory/material-stock/material-stock.component').then(m => m.MaterialStockComponent) },
            { path: 'inventory/suppliers', loadComponent: () => import('./pages/inventory/suppliers/suppliers').then(m => m.SuppliersComponent) },
            { path: 'infrastructure/inquiries', loadComponent: () => import('./pages/infrastructure/inquiry-dashboard/inquiry-dashboard.component').then(m => m.InquiryDashboardComponent) },
        ]
    },
    { path: '**', redirectTo: '' }
];
