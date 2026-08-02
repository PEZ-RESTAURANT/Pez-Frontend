import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency } from '../utils/format-currency';

@Pipe({
  name: 'currencyPen',
  standalone: true,
})
export class CurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCurrency(value);
  }
}
