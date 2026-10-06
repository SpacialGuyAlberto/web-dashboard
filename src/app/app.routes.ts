import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { DashboardComponent } from '@features/dashboard/dashboard.component';
import { ProjectsComponent } from '@features/projects/projects.component';
import { WorkflowsComponent } from '@features/workflows/workflows.component';
import { FieldCrewsComponent } from '@features/field-management/field-crews/field-crews.component';
import { SegmentsComponent } from '@features/segments/segments';
import { SubcontractorsComponent } from '@features/field-management/subcontractors/subcontractors.component';
import { ScheduleComponent } from '@features/schedule/schedule.component';
import { WorkLogComponent } from '@features/field-management/work-log/work-log.component';
import { BillingReportComponent } from '@features/billing/billing-report.component';
import { GisViewerComponent } from '@features/gis/gis-viewer.component';

import { LoginComponent } from '@features/auth/login/login.component';
import { RegisterComponent } from '@features/auth/register/register.component';

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
            { path: 'project-details', loadComponent: () => import('./features/projects/project-details/project-details.component').then(m => m.ProjectDetailsComponent) },
            { path: 'project-details/clusters/:clusterId/areas', loadComponent: () => import('./features/clusters/cluster-area-dashboard/cluster-area-dashboard.component').then(m => m.ClusterAreaDashboardComponent) },
            { path: 'project-details/clusters/:clusterId/pop/:popId', loadComponent: () => import('./features/clusters/nodes/pop-dashboard/pop-dashboard').then(m => m.PopDashboard) },
            { path: 'project-details/clusters/:clusterId/dp/:dpId', loadComponent: () => import('./features/clusters/nodes/dp-dashboard/dp-dashboard').then(m => m.DpDashboard) },
            { path: 'segments', component: SegmentsComponent },
            { path: 'subcontractors', component: SubcontractorsComponent },
            { path: 'schedule', component: ScheduleComponent },
            { path: 'work-logs', component: WorkLogComponent },
            { path: 'billing-reports', component: BillingReportComponent },
            { path: 'gis-viewer', component: GisViewerComponent },
            { path: 'risk-dashboard', loadComponent: () => import('./features/risk-planning/risk-dashboard.component').then(m => m.RiskDashboardComponent) },
            { path: 'progress', loadComponent: () => import('./features/progress/progress.component').then(m => m.ProgressComponent) },
            { path: 'workflows', component: WorkflowsComponent },
            { path: 'field-crews', component: FieldCrewsComponent },
            { path: 'field-crews/:id', loadComponent: () => import('./features/field-management/crew-detail/crew-detail.component').then(m => m.CrewDetailComponent) },
            { path: 'config/fields', loadComponent: () => import('./features/field-config/field-config.component').then(m => m.FieldConfigComponent) },
            { path: 'users/:id', loadComponent: () => import('./features/user-management/user-detail/user-detail.component').then(m => m.UserDetailComponent) },
            { path: 'users', loadComponent: () => import('./features/user-management/user-management/user-management.component').then(m => m.UserManagementComponent) },
            { path: 'inventory/machines', loadComponent: () => import('./features/inventory/machinery-list/machinery-list.component').then(m => m.MachineryListComponent) },
            { path: 'inventory/materials', loadComponent: () => import('./features/inventory/material-stock/material-stock.component').then(m => m.MaterialStockComponent) },
            { path: 'inventory/suppliers', loadComponent: () => import('./features/inventory/suppliers/suppliers').then(m => m.SuppliersComponent) },
            { path: 'infrastructure/inquiries', loadComponent: () => import('./features/infrastructure/inquiry-dashboard/inquiry-dashboard.component').then(m => m.InquiryDashboardComponent) },
        ]
    },
    { path: '**', redirectTo: '' }
];
