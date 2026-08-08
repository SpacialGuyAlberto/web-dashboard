import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '@core/auth/auth.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly STORAGE_KEY = 'mock_users';

    constructor(private http: HttpClient) {
        this.initializeMockData();
    }

    private initializeMockData() {
        if (!sessionStorage.getItem(this.STORAGE_KEY)) {
            const mockUsers: User[] = [
                { id: 1, email: 'admin@quarkbau.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN' },
                { id: 2, email: 'pm@quarkbau.com', firstName: 'Hans', lastName: 'Müller', role: 'PROJECT_MANAGER' },
                { id: 3, email: 'worker1@quarkbau.com', firstName: 'Lukas', lastName: 'Schmidt', role: 'FIELD_WORKER' },
                { id: 4, email: 'worker2@quarkbau.com', firstName: 'Max', lastName: 'Weber', role: 'FIELD_WORKER' },
                { id: 5, email: 'sub@partner.com', firstName: 'Klaus', lastName: 'Wagner', role: 'SUBCONTRACTOR' },
                { id: 6, email: 'fiber@expert.com', firstName: 'Sophie', lastName: 'Klein', role: 'FIELD_WORKER' },
                { id: 7, email: 'planning@quarkbau.com', firstName: 'Emma', lastName: 'Richter', role: 'PROJECT_MANAGER' }
            ];
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(mockUsers));
        }
    }

    private getUsers(): User[] {
        const data = sessionStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    getAllUsers(): Observable<User[]> {
        return of(this.getUsers());
    }

    getUserById(id: number): Observable<User> {
        const user = this.getUsers().find(u => u.id === id);
        if (user) return of(user);
        throw new Error('User not found');
    }

    updateUser(id: number, user: Partial<User>): Observable<User> {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...user };
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
            return of(users[index]);
        }
        throw new Error('User not found');
    }

    deleteUser(id: number): Observable<void> {
        const users = this.getUsers();
        const kept = users.filter(u => u.id !== id);
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(kept));
        return of(void 0);
    }
}
