import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PrintAgentService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:9200';

  private readonly PRINTER_KEY = 'altoque-selected-printer-name';
  private readonly WIDTH_KEY = 'altoque-selected-print-width';

  /**
   * Envía petición para detectar e instalar automáticamente WinUSB en impresoras USB conectadas.
   */
  detectNewPrinters(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/detect-new-printers`, {});
  }

  /**
   * Verifica si el agente de impresión local está activo y respondiendo.
   */
  checkAgentStatus(): Observable<boolean> {
    return this.http.get<{ status: string }>(`${this.baseUrl}/status`).pipe(
      map(res => res && res.status === 'ok'),
      catchError(() => of(false))
    );
  }

  /**
   * Obtiene la lista de impresoras físicas instaladas en el sistema.
   */
  getSystemPrinters(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/printers`).pipe(
      catchError(err => {
        console.error('Error fetching printers from local agent:', err);
        return of([]);
      })
    );
  }

  /**
   * Envía un lote de operaciones ESC/POS estructuradas al agente local de impresión.
   */
  sendPrintJob(operations: any[]): Observable<boolean> {
    const printerName = this.getSelectedPrinter();
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/print`, {
      printerName,
      operations
    }).pipe(
      map(res => !!(res && res.success)),
      catchError(err => {
        console.error('Error dispatching print job to local agent:', err);
        throw err;
      })
    );
  }

  /**
   * Obtiene la lista de dispositivos de huella dactilar ZKTeco detectados en la red.
   */
  getFingerprintDevices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fingerprint-devices`).pipe(
      catchError(err => {
        console.error('Error fetching fingerprint devices:', err);
        return of([]);
      })
    );
  }

  /**
   * Guarda la configuración del huellero activo en el agente local.
   */
  saveFingerprintConfig(payload: { activeSerialNumber: string, backendUrl: string, token: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/fingerprint-devices/config`, payload).pipe(
      catchError(err => {
        console.error('Error saving fingerprint config to agent:', err);
        throw err;
      })
    );
  }

  /**
   * Obtiene el estado de conexión del huellero activo desde el agente local.
   */
  getFingerprintStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fingerprint-devices/status`).pipe(
      catchError(err => {
        console.error('Error fetching fingerprint status from agent:', err);
        return of({ status: 'disconnected', activeSerialNumber: null, lastSync: null });
      })
    );
  }

  /**
   * Configuración de la impresora seleccionada en el navegador local.
   */
  saveSelectedPrinter(name: string): void {
    localStorage.setItem(this.PRINTER_KEY, name);
  }

  getSelectedPrinter(): string {
    return localStorage.getItem(this.PRINTER_KEY) || '';
  }

  /**
   * Configuración del ancho de papel en el navegador local (por defecto 80mm).
   */
  saveSelectedWidth(width: number): void {
    localStorage.setItem(this.WIDTH_KEY, width.toString());
  }

  getSelectedWidth(): number {
    const w = localStorage.getItem(this.WIDTH_KEY);
    return w ? parseInt(w, 10) : 80;
  }

  /**
   * Formatea un ticket de cocina (comanda).
   */
  formatKitchenTicket(zoneName: string, tableNum: number, waiterName: string, items: any[]): any[] {
    const dateTime = new Date().toLocaleString('es-PE', { hour12: false });
    const ops: any[] = [];
    ops.push({ type: 'align', value: 'center' });
    ops.push({ type: 'size', value: { width: true, height: true } });
    ops.push({ type: 'println', value: '*** TICKET DE COCINA ***' });
    ops.push({ type: 'size', value: { width: false, height: false } });
    ops.push({ type: 'println', value: `ZONA: ${zoneName.toUpperCase()}` });
    ops.push({ type: 'line', value: 'dashed' });
    
    ops.push({ type: 'align', value: 'left' });
    ops.push({ type: 'println', value: `Mesa: M${tableNum}` });
    ops.push({ type: 'println', value: `Fecha/Hora: ${dateTime}` });
    ops.push({ type: 'println', value: `Mozo: ${waiterName}` });
    ops.push({ type: 'line', value: 'dashed' });
    
    ops.push({ type: 'bold', value: true });
    ops.push({ type: 'println', value: 'Cant   Producto / Obs' });
    ops.push({ type: 'bold', value: false });
    ops.push({ type: 'line', value: 'dashed' });
    
    for (const it of items) {
      const name = it.productName || it.product?.name || `Producto #${it.productId}`;
      ops.push({ type: 'bold', value: true });
      ops.push({ type: 'println', value: `x${it.quantity}    ${name}` });
      ops.push({ type: 'bold', value: false });
      if (it.note) {
        ops.push({ type: 'println', value: `  * Obs: ${it.note}` });
      }
    }
    ops.push({ type: 'line', value: 'dashed' });
    ops.push({ type: 'align', value: 'center' });
    ops.push({ type: 'println', value: '[ Fin de Ticket de Cocina ]' });
    ops.push({ type: 'cut' });
    return ops;
  }

  /**
   * Formatea un ticket de cancelación de plato.
   */
  formatCancellationTicket(zoneName: string, tableNum: number, productName: string, qty: number, reasonText: string, detail: string): any[] {
    const dateTime = new Date().toLocaleString('es-PE', { hour12: false });
    const ops: any[] = [];
    ops.push({ type: 'align', value: 'center' });
    ops.push({ type: 'size', value: { width: true, height: true } });
    ops.push({ type: 'println', value: '*** PRODUCTOS CANCELADOS ***' });
    ops.push({ type: 'size', value: { width: false, height: false } });
    ops.push({ type: 'println', value: `ZONA: ${zoneName.toUpperCase()}` });
    ops.push({ type: 'line', value: 'dashed' });
    
    ops.push({ type: 'align', value: 'left' });
    ops.push({ type: 'println', value: `Mesa: M${tableNum}` });
    ops.push({ type: 'println', value: `Fecha/Hora: ${dateTime}` });
    ops.push({ type: 'println', value: `Motivo: ${reasonText}` });
    if (detail) {
      ops.push({ type: 'println', value: `Detalle: ${detail}` });
    }
    ops.push({ type: 'line', value: 'dashed' });
    
    ops.push({ type: 'bold', value: true });
    ops.push({ type: 'println', value: 'Cant   Producto' });
    ops.push({ type: 'line', value: 'dashed' });
    ops.push({ type: 'bold', value: true });
    ops.push({ type: 'println', value: `x${qty}    ${productName}` });
    ops.push({ type: 'bold', value: false });
    
    ops.push({ type: 'line', value: 'dashed' });
    ops.push({ type: 'align', value: 'center' });
    ops.push({ type: 'println', value: '[ Cancelación Registrada ]' });
    ops.push({ type: 'cut' });
    return ops;
  }

  /**
   * Formatea una pre-cuenta o comprobante de venta fiscal (Boleta/Factura).
   */
  formatReceipt(restaurantInfo: any, order: any, sale: any, mode: 'pre-cuenta' | 'venta', tableNumber: number): any[] {
    const ops: any[] = [];
    
    // Header
    ops.push({ type: 'align', value: 'center' });
    ops.push({ type: 'bold', value: true });
    ops.push({ type: 'println', value: restaurantInfo?.name || 'AL TOQUE RESTAURANTE' });
    ops.push({ type: 'bold', value: false });
    ops.push({ type: 'println', value: restaurantInfo?.address || 'DIRECCIÓN NO REGISTRADA' });
    ops.push({ type: 'println', value: `R.U.C. ${restaurantInfo?.businessDocumentNumber || '00000000000'}` });
    ops.push({ type: 'println', value: `Telf: ${restaurantInfo?.contactPhone || 'S/T'}` });
    ops.push({ type: 'line', value: 'dashed' });
    
    if (mode === 'pre-cuenta') {
      ops.push({ type: 'bold', value: true });
      ops.push({ type: 'println', value: '*** PRE-CUENTA ***' });
      ops.push({ type: 'println', value: 'NO VÁLIDO COMO COMPROBANTE' });
      ops.push({ type: 'bold', value: false });
      ops.push({ type: 'line', value: 'dashed' });
    } else {
      const isFactura = sale?.documentType === 'FACTURA_ELECTRONICA' || sale?.documentType === 'INVOICE';
      ops.push({ type: 'bold', value: true });
      ops.push({ type: 'println', value: isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA' });
      ops.push({ type: 'println', value: sale?.ticketNumber || 'B001-00000001' });
      ops.push({ type: 'bold', value: false });
      ops.push({ type: 'line', value: 'dashed' });
    }
    
    // Info
    ops.push({ type: 'align', value: 'left' });
    ops.push({ type: 'println', value: `Mesa: M${tableNumber || '0'}   Comanda: #${order?.id || '0'}` });
    const dateVal = sale?.createdAt || order?.createdAt || new Date().toISOString();
    const formattedDate = new Date(dateVal).toLocaleString('es-PE', { hour12: false });
    ops.push({ type: 'println', value: `Fecha: ${formattedDate}` });
    
    if (mode === 'venta') {
      const isFactura = sale?.documentType === 'FACTURA_ELECTRONICA' || sale?.documentType === 'INVOICE';
      if (isFactura) {
        ops.push({ type: 'println', value: `R.U.C. Cliente: ${sale?.customerDocumentNumber}` });
        ops.push({ type: 'println', value: `Razón Social: ${sale?.customerName}` });
      } else {
        ops.push({ type: 'println', value: `Cliente: ${sale?.customerName || 'PÚBLICO GENERAL'}` });
        ops.push({ type: 'println', value: `D.N.I. / Doc: ${sale?.customerDocumentNumber || '00000000'}` });
      }
    }
    ops.push({ type: 'line', value: 'dashed' });
    
    // Details Header
    ops.push({ type: 'bold', value: true });
    ops.push({ type: 'println', value: 'Cant  Producto         P.Unit    Total' });
    ops.push({ type: 'bold', value: false });
    ops.push({ type: 'line', value: 'dashed' });
    
    // Items
    let total = 0;
    const items = order?.items || [];
    for (const item of items) {
      const name = item.productName || item.product?.name || `Producto #${item.productId}`;
      const qty = item.quantity;
      const price = item.unitPriceSnapshot || item.unitPrice || 0;
      const subtotal = qty * price;
      total += subtotal;
      
      ops.push({ type: 'bold', value: true });
      ops.push({ type: 'println', value: `x${qty}  ${name}` });
      ops.push({ type: 'bold', value: false });
      ops.push({ type: 'align', value: 'right' });
      ops.push({ type: 'println', value: `S/ ${price.toFixed(2)}    S/ ${subtotal.toFixed(2)}` });
      ops.push({ type: 'align', value: 'left' });
      if (item.note) {
        ops.push({ type: 'println', value: `    * Obs: ${item.note}` });
      }
    }
    ops.push({ type: 'line', value: 'dashed' });
    
    // Totals
    ops.push({ type: 'align', value: 'right' });
    const opGravada = total / 1.18;
    const igv = total - opGravada;
    ops.push({ type: 'println', value: `OP. GRAVADA: S/ ${opGravada.toFixed(2)}` });
    ops.push({ type: 'println', value: `I.G.V. (18%): S/ ${igv.toFixed(2)}` });
    ops.push({ type: 'bold', value: true });
    ops.push({ type: 'println', value: `TOTAL GENERAL: S/ ${total.toFixed(2)}` });
    ops.push({ type: 'bold', value: false });
    ops.push({ type: 'align', value: 'left' });
    ops.push({ type: 'line', value: 'dashed' });
    
    // QR Code for fiscal tickets
    if (mode === 'venta') {
      const rucEmisor = restaurantInfo?.businessDocumentNumber || '20123456789';
      const isFactura = sale?.documentType === 'FACTURA_ELECTRONICA' || sale?.documentType === 'INVOICE';
      const tipoComp = isFactura ? '01' : '03';
      const ticketNum = sale?.ticketNumber || 'B001-00000001';
      const parts = ticketNum.split('-');
      const serie = parts[0] || 'B001';
      const correlativo = parts[1] || '00000001';
      const igvStr = igv.toFixed(2);
      const totalStr = total.toFixed(2);
      const dateOnly = dateVal.split('T')[0];
      const docReceptorType = isFactura ? '6' : '1';
      const docReceptor = sale?.customerDocumentNumber || '00000000';
      
      const qrData = `${rucEmisor}|${tipoComp}|${serie}|${correlativo}|${igvStr}|${totalStr}|${dateOnly}|${docReceptorType}|${docReceptor}|`;
      
      ops.push({ type: 'align', value: 'center' });
      ops.push({ type: 'qr', value: qrData });
      ops.push({ type: 'println', value: '' });
      ops.push({ type: 'println', value: 'Autorizado mediante Resolución de Superintendencia N° 018-2015/SUNAT.' });
      ops.push({ type: 'line', value: 'dashed' });
    }
    
    // Footer
    ops.push({ type: 'align', value: 'center' });
    ops.push({ type: 'bold', value: true });
    ops.push({ type: 'println', value: '¡GRACIAS POR SU VISITA!' });
    ops.push({ type: 'bold', value: false });
    ops.push({ type: 'println', value: 'Impreso con software Al Toque' });
    ops.push({ type: 'cut' });
    
    return ops;
  }
}
