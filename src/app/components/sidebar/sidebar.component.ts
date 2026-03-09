import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

interface NavigationItem {
    label: string;
    icon: string;
    route?: string;
    children?: NavigationItem[];
    isOpen?: boolean;
    allowedRoles?: string[]; // RBAC
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
    @Output() themeToggled = new EventEmitter<void>();
    isDarkMode = true;
    currentUser: User | null = null;

    menuGroups: NavigationItem[] = [
        {
            label: 'Home',
            icon: '📊',
            route: '/',
            allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_MANAGER']
        },
        {
            label: 'Operations',
            icon: '🚀',
            isOpen: true,
            allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_MANAGER'],
            children: [
                { label: 'Map View', icon: '🗺️', route: '/projects' },
                { label: 'Workflows', icon: '📋', route: '/workflows' },
                { label: 'Schedule', icon: '🗓️', route: '/schedule' },
                { label: 'GIS Viewer', icon: '🌍', route: '/gis-viewer' },
                { label: '🔮 Risks (AI)', icon: '⚠️', route: '/risk-dashboard' },
                { label: 'Progress', icon: '📈', route: '/progress' },
                { label: 'Requests (Permits)', icon: '🏛️', route: '/infrastructure/inquiries' } // Added Link
            ]
        },
        {
            label: 'Field Management',
            icon: '👷',
            isOpen: false,
            allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_MANAGER', 'FIELD_WORKER', 'SUBCONTRACTOR'],
            children: [
                { label: 'Field Crews', icon: '👷', route: '/field-crews' },
                { label: 'Subcontractors', icon: '🤝', route: '/subcontractors' },
                { label: 'Work Logs', icon: '📝', route: '/work-logs' }
            ]
        },
        {
            label: 'Inventory',
            icon: '📦',
            isOpen: false,
            allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'SITE_MANAGER', 'FIELD_WORKER'], // Field Worker View Only
            children: [
                { label: 'Machinery', icon: '🚜', route: '/inventory/machines' },
                { label: 'Materials', icon: '🧱', route: '/inventory/materials' },
                { label: 'Suppliers', icon: '🏭', route: '/inventory/suppliers' }
            ]
        },
        {
            label: 'Administration',
            icon: '⚙️',
            isOpen: false,
            allowedRoles: ['ADMIN'],
            children: [
                { label: 'Billing', icon: '💰', route: '/billing-reports' },
                { label: 'Field Config', icon: '🛠️', route: '/config/fields' },
                { label: 'Users', icon: '👥', route: '/users' }
            ]
        }
    ];

    constructor(public authService: AuthService, private router: Router) {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.filterMenu();
        });
        // ... (router events kept in separate block if needed, but constructor usually runs once)
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.checkActiveGroup(event.url);
        });
    }

    filteredGroups: NavigationItem[] = [];

    // Filter menu based on user role
    filterMenu() {
        if (!this.currentUser) {
            this.filteredGroups = [];
            return;
        }

        const role = this.currentUser.role;

        this.filteredGroups = this.menuGroups.filter(group => {
            if (!group.allowedRoles) return true; // Public by default (or shouldn't be?)
            return group.allowedRoles.includes(role);
        });
    }

    ngOnInit() {
        this.checkActiveGroup(this.router.url);
    }

    toggleGroup(group: NavigationItem) {
        if (group.children) {
            group.isOpen = !group.isOpen;
        } else if (group.route) {
            this.router.navigate([group.route]);
        }
    }

    checkActiveGroup(url: string) {
        this.menuGroups.forEach(group => {
            if (group.children) {
                // If any child is active, open the group
                const hasActiveChild = group.children.some(child => child.route && url.includes(child.route));
                if (hasActiveChild) {
                    group.isOpen = true;
                }
            }
        });
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.themeToggled.emit();
        if (this.isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    logout() {
        this.authService.logout();
    }
}
