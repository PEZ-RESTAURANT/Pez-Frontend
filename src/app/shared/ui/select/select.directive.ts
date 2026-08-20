import { Directive, Input, HostBinding, Attribute } from '@angular/core';
import { cn } from '../../utils/cn';

@Directive({
  selector: 'select[appSelect]',
  standalone: true,
})
export class SelectDirective {
  @Input() userClass = '';

  constructor(@Attribute('class') private staticClass: string) {}

  @HostBinding('class')
  get hostClasses(): string {
    return cn(
      'flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-colors duration-200',
      this.staticClass,
      this.userClass
    );
  }
}
