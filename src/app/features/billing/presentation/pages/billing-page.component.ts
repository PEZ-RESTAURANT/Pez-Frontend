import { Component } from '@angular/core';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  template: `
    <div class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
      <h2 class="text-2xl font-bold mb-2">Facturación</h2>
      <p class="text-gray-500">Consulta de comprobantes de pago emitidos.</p>
    </div>
  `
})
export class BillingPageComponent {}
