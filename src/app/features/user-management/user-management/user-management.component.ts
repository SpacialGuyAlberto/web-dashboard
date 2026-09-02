import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '@core/auth/auth.model';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css'],
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
                return 'bg-white/10 text-white border-white/20';
            case 'PROJECT_MANAGER':
                return 'bg-[#6938ef]/10 text-[#6938ef] border-[#6938ef]/20';
            case 'FIELD_WORKER':
                return 'bg-[#2fb080]/10 text-[#2fb080] border-[#2fb080]/20';
            case 'SUBCONTRACTOR':
                return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
            default:
                return 'bg-white/5 text-white/60 border-white/10';
        }
    }
}
