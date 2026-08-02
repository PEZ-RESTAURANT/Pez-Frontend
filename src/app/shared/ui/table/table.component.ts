import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../utils/cn';

@Component({
  selector: 'app-table-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="relative w-full overflow-auto"><ng-content></ng-content></div>`,
})
export class TableWrapperComponent {
  @Input() userClass: string = '';
  @HostBinding('class')
  get hostClasses(): string {
    return this.userClass;
  }
}

@Component({
  selector: 'table[appTable]',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class TableDirective {
  @Input() userClass: string = '';
  @HostBinding('class')
  get hostClasses(): string {
    return cn('w-full caption-bottom text-sm', this.userClass);
  }
}

@Component({
  selector: 'thead[appTableHeader]',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class TableHeaderDirective {
  @Input() userClass: string = '';
  @HostBinding('class')
  get hostClasses(): string {
    return cn('[&_tr]:border-b border-gray-200 dark:border-gray-800', this.userClass);
  }
}

@Component({
  selector: 'tbody[appTableBody]',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class TableBodyDirective {
  @Input() userClass: string = '';
  @HostBinding('class')
  get hostClasses(): string {
    return cn('[&_tr:last-child]:border-0', this.userClass);
  }
}

@Component({
  selector: 'tr[appTableRow]',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class TableRowDirective {
  @Input() userClass: string = '';
  @HostBinding('class')
  get hostClasses(): string {
    return cn('border-b border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50', this.userClass);
  }
}

@Component({
  selector: 'th[appTableHead]',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class TableHeadDirective {
  @Input() userClass: string = '';
  @HostBinding('class')
  get hostClasses(): string {
    return cn('h-12 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400 [&:has([role=checkbox])]:pr-0', this.userClass);
  }
}

@Component({
  selector: 'td[appTableCell]',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class TableCellDirective {
  @Input() userClass: string = '';
  @HostBinding('class')
  get hostClasses(): string {
    return cn('p-4 align-middle [&:has([role=checkbox])]:pr-0 text-foreground', this.userClass);
  }
}
