import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Toast } from '../models/toast.model';

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastSubject = new Subject<Toast>();
    toastState = this.toastSubject.asObservable();

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
        this.toastSubject.next({ message, type });
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
}
