import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '@core/layout/sidebar/sidebar.component';
import { AuthService } from '@core/auth/auth.service';
import { FooterComponent } from '@core/layout/footer/footer.component';
import { ToastComponent } from '@core/notifications/toast/toast.component';

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

  constructor(public authService: AuthService) { }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onSidebarCollapse(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }

  logout() {
    this.authService.logout();
  }
}
