import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastContainerComponent } from '../../shared/ui/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, ToastContainerComponent],
  template: `
    <div class="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-950 text-foreground transition-colors duration-200">
      <!-- Sidebar for Desktop -->
      <app-sidebar class="hidden md:flex h-full"></app-sidebar>

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-topbar (toggleMobileMenu)="isMobileMenuOpen.set(true)"></app-topbar>

        <main class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Mobile Drawer Sidebar Overlay -->
    <div *ngIf="isMobileMenuOpen()" class="md:hidden fixed inset-0 z-50 flex">
      <!-- Backdrop -->
      <div 
        (click)="isMobileMenuOpen.set(false)" 
        class="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
      ></div>

      <!-- Drawer Content -->
      <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900 transition-transform duration-300 transform translate-x-0 h-full shadow-2xl">
        <!-- Close Button -->
        <div class="absolute top-4 right-4 z-10">
          <button 
            (click)="isMobileMenuOpen.set(false)"
            class="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-250 transition-colors cursor-pointer border-none shadow-xs"
          >
            ✕
          </button>
        </div>

        <!-- Sidebar instance inside mobile drawer mode -->
        <app-sidebar [isMobileDrawer]="true" (linkClicked)="isMobileMenuOpen.set(false)" class="h-full w-full"></app-sidebar>
      </div>
    </div>

    <app-toast-container></app-toast-container>
  `
})
export class MainLayoutComponent {
  public isMobileMenuOpen = signal<boolean>(false);
}
