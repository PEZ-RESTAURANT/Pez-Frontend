import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 flex flex-col justify-between transition-colors duration-300">
      
      <!-- Top Header -->
      <header class="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <!-- Logo SVG: A sleek fish shape -->
          <div class="bg-blue-600 dark:bg-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <span class="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Al Toque
          </span>
        </div>
        
        <a
          routerLink="/auth/login"
          class="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Iniciar sesión
        </a>
      </header>

      <!-- Hero Section -->
      <main class="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div class="space-y-6 max-w-2xl">
          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs font-semibold tracking-wide">
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Sistema Integrado de Gestión
          </div>

          <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Toma el control absoluto de tu 
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Restaurante
            </span>
          </h1>

          <p class="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
            La solución definitiva y moderna para la administración culinaria. Controla tus mesas en tiempo real, agiliza la comunicación en cocina, cuadra tu caja y gestiona el inventario de insumos sin complicaciones.
          </p>

          <div class="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              routerLink="/registro"
              class="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transform hover:-translate-y-0.5 transition-all text-center"
            >
              Registrar mi restaurante
            </a>
            
            <a
              routerLink="/auth/login"
              class="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-gray-800 dark:text-gray-200 font-bold rounded-xl border border-gray-200 dark:border-gray-700 transition-all text-center"
            >
              Ya tengo cuenta, iniciar sesión
            </a>
          </div>
        </div>
      </main>

      <!-- Simple Footer -->
      <footer class="py-8 text-center text-xs text-gray-500 dark:text-gray-500">
        &copy; {{ currentYear }} Sistema Al Toque. Todos los derechos reservados.
      </footer>
    </div>
  `
})
export class LandingPageComponent {
  currentYear = new Date().getFullYear();
}
