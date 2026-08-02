import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastContainerComponent } from '../../shared/ui/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastContainerComponent],
  template: `
    <div class="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-950 text-foreground transition-colors duration-200">
      <app-sidebar></app-sidebar>

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-topbar></app-topbar>

        <main class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <app-toast-container></app-toast-container>
  `
})
export class MainLayoutComponent {}
