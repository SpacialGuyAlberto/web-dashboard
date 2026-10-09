import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '@core/layout/sidebar/sidebar.component';
import { AuthService } from '@core/auth/auth.service';
import { FooterComponent } from '@core/layout/footer/footer.component';
import { ToastComponent } from '@core/notifications/toast/toast.component';
import { SseNotificationService } from '@core/notifications/sse-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, FooterComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.css'
})
export class App {
  sidebarOpen = false;
  sidebarCollapsed = false;
  showNotifications = false;

  constructor(public authService: AuthService, public sseNotificationService: SseNotificationService) { }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onSidebarCollapse(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }

  logout() {
    this.authService.logout();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.sseNotificationService.markAllAsRead();
    }
  }
}
