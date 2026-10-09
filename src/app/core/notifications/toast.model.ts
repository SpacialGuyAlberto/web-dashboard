export interface Toast {
    message: string;
    title?: string;
    badge?: string;
    badgeColor?: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'industrial';
    id?: number;
}
