import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Toast } from './toast.model';

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastSubject = new Subject<Toast>();
    toastState = this.toastSubject.asObservable();

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' | 'industrial' = 'info', title?: string, badge?: string, badgeColor?: string) {
        this.toastSubject.next({ message, type, title, badge, badgeColor });
    }

    success(message: string) {
        this.show(message, 'success');
    }

    error(message: string) {
        this.show(message, 'error');
    }

    info(message: string) {
        this.show(message, 'info');
    }

    warning(message: string) {
        this.show(message, 'warning');
    }

    industrial(title: string, message: string, badge: string = 'UPDATE', badgeColor: string = 'blue') {
        this.show(message, 'industrial', title, badge, badgeColor);
    }
}
