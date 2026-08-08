import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '@core/auth/auth.model';

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-detail.component.html',
    styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
    user: User | null = null;
    loading = true;
    error: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private userService: UserService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadUser(Number(id));
        } else {
            this.error = 'ID de usuario no proporcionado';
            this.loading = false;
        }
    }

    loadUser(id: number): void {
        this.loading = true;
        this.error = null;
        console.log('Loading user with ID:', id);

        this.userService.getUserById(id).subscribe({
            next: (data) => {
                console.log('User data received:', data);
                // Mock enrichment logic
                let enrichedUser = { ...data };

                if (data.role === 'FIELD_WORKER') {
                    enrichedUser = {
                        ...data,
                        crewName: 'Crew Alpha-1',
                        location: 'Segment 42 (lat: 40.712, long: -74.006)',
                        lastActivity: 'Splicing Fiber',
                        isSubcontractor: false
                    };
                } else if (data.role === 'SUBCONTRACTOR') {
                    enrichedUser = {
                        ...data,
                        crewName: 'Sub-Team External',
                        location: 'Segment 15',
                        lastActivity: 'Trenching',
                        isSubcontractor: true
                    };
                }

                this.user = enrichedUser;
                this.loading = false;
                console.log('State updated. Loading:', this.loading, 'User:', this.user);
                this.cd.detectChanges();
            },
            error: (error) => {
                console.error('Error loading user details', error);
                this.error = 'Error al cargar los detalles del usuario. Por favor intente nuevamente.';
                if (error.status === 403) {
                    this.error = 'No tiene permisos para ver este usuario.';
                } else if (error.status === 404) {
                    this.error = 'Usuario no encontrado.';
                }
                this.loading = false;
                this.cd.detectChanges();
            }
        });
    }

    getInitials(user: User): string {
        return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }

    getRoleLabel(role: string): string {
        switch (role) {
            case 'ADMIN': return 'Administrador';
            case 'PROJECT_MANAGER': return 'Project Manager';
            case 'FIELD_WORKER': return 'Trabajador de Campo';
            case 'SUBCONTRACTOR': return 'Subcontratista';
            default: return role;
        }
    }

    getRoleBadgeClass(role: string): string {
        switch (role) {
            case 'ADMIN':
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
            case 'PROJECT_MANAGER':
                return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            case 'FIELD_WORKER':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
            case 'SUBCONTRACTOR':
                return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    }
}
