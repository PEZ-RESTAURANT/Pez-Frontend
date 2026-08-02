import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../utils/cn';

@Component({
  selector: 'button[appButton], a[appButton]',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
})
export class ButtonDirective {
  @Input() variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
  @Input() size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
  @Input() userClass: string = '';

  @HostBinding('class')
  get hostClasses(): string {
    return cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
      {
        'bg-blue-600 text-white hover:bg-blue-700': this.variant === 'default',
        'bg-red-600 text-white hover:bg-red-700': this.variant === 'destructive',
        'border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 text-foreground': this.variant === 'outline',
        'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-foreground': this.variant === 'secondary',
        'hover:bg-gray-100 dark:hover:bg-gray-800 text-foreground': this.variant === 'ghost',
        'text-blue-600 underline-offset-4 hover:underline': this.variant === 'link',
        'h-10 px-4 py-2': this.size === 'default',
        'h-9 rounded-md px-3': this.size === 'sm',
        'h-11 rounded-md px-8': this.size === 'lg',
        'h-10 w-10 p-0': this.size === 'icon',
      },
      this.userClass
    );
  }
}
