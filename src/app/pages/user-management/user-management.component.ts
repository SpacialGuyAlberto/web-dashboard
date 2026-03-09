import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../services/auth.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './user-management.component.html',
})
export class UserManagementComponent implements OnInit {
    users: User[] = [];
    loading = true;
    filterRole: string = 'ALL';

    constructor(private userService: UserService) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading = true;
        this.userService.getAllUsers().subscribe({
            next: (data) => {
                // Enrich with mock data for demonstration
                this.users = data.map(user => {
                    if (user.role === 'FIELD_WORKER') {
                        return {
                            ...user,
                            crewName: 'Crew Alpha-1',
                            location: 'Segment 42 (lat: 40.712, long: -74.006)',
                            lastActivity: 'Splicing Fiber',
                            isSubcontractor: false
                        };
                    } else if (user.role === 'SUBCONTRACTOR') {
                        return {
                            ...user,
                            crewName: 'Sub-Team External',
                            location: 'Segment 15',
                            lastActivity: 'Trenching',
                            isSubcontractor: true
                        };
                    }
                    return user;
                });
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading users', error);
                this.loading = false;
            }
        });
    }

    getFilteredUsers(): User[] {
        if (this.filterRole === 'ALL') {
            return this.users;
        }
        return this.users.filter(u => u.role === this.filterRole);
    }

    getInitials(user: User): string {
        return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }

    getRoleLabel(role: string): string {
        switch (role) {
            case 'ADMIN': return 'Admin';
            case 'PROJECT_MANAGER': return 'Project Manager';
            case 'FIELD_WORKER': return 'Field Worker';
            case 'SUBCONTRACTOR': return 'Subcontractor';
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
