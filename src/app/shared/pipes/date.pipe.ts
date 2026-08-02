import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../utils/format-date';

@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class DatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    return formatDate(value);
  }
}
