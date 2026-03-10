import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { Toast } from '../../models/toast.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './toast.component.html'
})
export class ToastComponent implements OnInit, OnDestroy {
    toasts: Toast[] = [];
    subscription: Subscription = new Subscription();

    constructor(private toastService: ToastService) { }

    ngOnInit() {
        this.subscription = this.toastService.toastState.subscribe((toast: Toast) => {
            const id = Date.now();
            const newToast = { ...toast, id };
            this.toasts.push(newToast);

            setTimeout(() => this.remove(id), 3000); // Auto remove after 3s
        });
    }

    remove(id: number) {
        this.toasts = this.toasts.filter(t => t.id !== id);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
