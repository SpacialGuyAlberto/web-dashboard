import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from './toast.service';

export interface NotificationMessage {
  id: string;
  recipientId: string;
  channel: string;
  title: string;
  body: string;
  eventType: string;
  payload: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class SseNotificationService {
  private eventSource!: EventSource;
  private notificationsSubject = new BehaviorSubject<NotificationMessage[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private zone: NgZone, private toastService: ToastService) {
    this.connect();
  }

  private connect() {
    this.zone.runOutsideAngular(() => {
      // Connect to the monolithic SSE endpoint for BACKOFFICE
      this.eventSource = new EventSource('http://localhost:8080/api/notifications/stream?userId=BACKOFFICE');

      this.eventSource.addEventListener('NOTIFICATION', (event: any) => {
        this.zone.run(() => {
          if (event.data) {
            const message: NotificationMessage = JSON.parse(event.data);
            this.handleNewMessage(message);
          }
        });
      });

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error, attempting to reconnect...', error);
        this.eventSource.close();
        setTimeout(() => this.connect(), 5000);
      };
    });
  }

  private handleNewMessage(message: NotificationMessage) {
    const currentList = this.notificationsSubject.value;
    this.notificationsSubject.next([message, ...currentList]);
    
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);

    let badgeText = "UPDATE";
    let badgeColor = "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (message.title.includes('Completada')) { badgeText = "COMPLETED"; badgeColor = "text-[#34d399] border-[#34d399]/30 bg-[#34d399]/10"; }
    else if (message.title.includes('Bloqueado')) { badgeText = "BLOCKED"; badgeColor = "text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10"; }
    else if (message.title.includes('IN_PROGRESS')) { badgeText = "IN PROGRESS"; badgeColor = "text-[#60a5fa] border-[#60a5fa]/30 bg-[#60a5fa]/10"; }
    else if (message.title.includes('Planificado')) { badgeText = "PLAN"; badgeColor = "text-[#a78bfa] border-[#a78bfa]/30 bg-[#a78bfa]/10"; }
    else if (message.title.includes('HOLD')) { badgeText = "HOLD"; badgeColor = "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10"; }

    this.toastService.industrial(message.title, message.body, badgeText, badgeColor);
  }

  public markAllAsRead() {
    this.unreadCountSubject.next(0);
  }
}
