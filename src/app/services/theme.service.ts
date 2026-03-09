import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'quarkbau-theme';
    private isDarkMode = new BehaviorSubject<boolean>(false);

    constructor() {
        this.initializeTheme();
    }

    private initializeTheme(): void {
        // Check localStorage for saved preference
        const savedTheme = localStorage.getItem(this.THEME_KEY);

        if (savedTheme) {
            this.isDarkMode.next(savedTheme === 'dark');
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.isDarkMode.next(prefersDark);
        }

        this.applyTheme(this.isDarkMode.value);
    }

    private applyTheme(isDark: boolean): void {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleTheme(): void {
        const newTheme = !this.isDarkMode.value;
        this.isDarkMode.next(newTheme);
        this.applyTheme(newTheme);
        localStorage.setItem(this.THEME_KEY, newTheme ? 'dark' : 'light');
    }

    setTheme(isDark: boolean): void {
        this.isDarkMode.next(isDark);
        this.applyTheme(isDark);
        localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
    }

    get isDark$(): Observable<boolean> {
        return this.isDarkMode.asObservable();
    }

    get isDark(): boolean {
        return this.isDarkMode.value;
    }
}
