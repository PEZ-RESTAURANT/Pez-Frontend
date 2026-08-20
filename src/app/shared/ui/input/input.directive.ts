import { Directive, Input, HostBinding, Attribute } from '@angular/core';
import { cn } from '../../utils/cn';

@Directive({
  selector: 'input[appInput]',
  standalone: true,
})
export class InputDirective {
  @Input() userClass = '';

  constructor(@Attribute('class') private staticClass: string) {}

  @HostBinding('class')
  get hostClasses(): string {
    return cn(
      'flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
      this.staticClass,
      this.userClass
    );
  }
}
