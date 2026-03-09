import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'PROJECT_MANAGER' | 'SITE_MANAGER' | 'FIELD_WORKER' | 'SUBCONTRACTOR';
    organizationId?: number;
    // Field Data Extensions
    crewName?: string;
    location?: string;
    lastActivity?: string;
    isSubcontractor?: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/api/auth';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {
        this.loadUserFromStorage();
    }

    private loadUserFromStorage(): void {
        let user = sessionStorage.getItem('user');

        if (!user) {
            // DEMO MODE: Auto-login as Admin if no session exists
            const mockUser: User = {
                id: 1,
                email: 'demo@quarkbau.com',
                firstName: 'Demo',
                lastName: 'Admin',
                role: 'ADMIN',
                organizationId: 1
            };
            const mockToken = 'mock-auto-jwt-token';

            sessionStorage.setItem('token', mockToken);
            sessionStorage.setItem('refreshToken', 'mock-auto-refresh-token');
            sessionStorage.setItem('user', JSON.stringify(mockUser));

            user = sessionStorage.getItem('user');
        }

        if (user) {
            this.currentUserSubject.next(JSON.parse(user));
        }
    }

    login(credentials: { email: string, password: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                sessionStorage.setItem('token', response.accessToken);
                sessionStorage.setItem('refreshToken', response.refreshToken);
                sessionStorage.setItem('user', JSON.stringify(response.user));
                this.currentUserSubject.next(response.user);
            })
        );
    }

    register(userData: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
            tap(response => {
                sessionStorage.setItem('token', response.accessToken);
                sessionStorage.setItem('refreshToken', response.refreshToken);
                sessionStorage.setItem('user', JSON.stringify(response.user));
                this.currentUserSubject.next(response.user);
            })
        );
    }

    logout(): void {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return sessionStorage.getItem('token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }
}
