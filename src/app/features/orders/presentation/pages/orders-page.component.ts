import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../infrastructure/services/orders.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
      <h2 class="text-2xl font-bold mb-2">Comandas y Pedidos</h2>
      <p class="text-gray-500 mb-6">Módulo de mesas y atención al salón.</p>

      <div class="space-y-4">
        <h3 class="font-semibold text-lg">Últimas Comandas</h3>
        @if (ordersService.orders$().length === 0) {
          <p class="text-sm text-gray-400">No hay comandas registradas en este turno.</p>
        } @else {
          <div class="grid gap-2">
            @for (order of ordersService.orders$(); track order.id) {
              <div class="p-3 border border-gray-100 dark:border-gray-800 rounded-md flex justify-between items-center text-foreground bg-gray-50 dark:bg-gray-900/50">
                <span>Comanda #{{ order.id }} - Mesa {{ order.tableId }}</span>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-medium capitalize">{{ order.status }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class OrdersPageComponent implements OnInit {
  public ordersService = inject(OrdersService);

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }
}
