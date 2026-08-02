import { ChangeDetectorRef, Component, Input, HostBinding, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule, ConnectionPositionPair } from '@angular/cdk/overlay';

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  template: `
    <div class="relative inline-block text-left" (click)="$event.stopPropagation()" cdkOverlayOrigin #trigger="cdkOverlayOrigin">
      <ng-content select="[trigger]"></ng-content>
    </div>
    
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isRendered"
      [cdkConnectedOverlayPositions]="positions"
      (overlayOutsideClick)="close()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
    >
      <div 
           [class.opacity-100]="isVisible" [class.scale-100]="isVisible" [class.translate-y-0]="isVisible" [class.pointer-events-auto]="isVisible"
           [class.opacity-0]="!isVisible" [class.scale-95]="!isVisible" [class.-translate-y-2]="!isVisible" [class.pointer-events-none]="!isVisible"
           [ngClass]="menuClass"
           class="rounded-md border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-1 text-foreground shadow-lg transition-all duration-200 ease-out outline-none flex flex-col gap-0.5 z-[110]">
        <ng-content></ng-content>
      </div>
    </ng-template>
  `,
})
export class DropdownMenuComponent {
  private cdr = inject(ChangeDetectorRef);

  @Input() menuClass = 'w-56 origin-top-right';
  
  isRendered = false;
  isVisible = false;

  positions = [
    new ConnectionPositionPair(
      { originX: 'end', originY: 'bottom' },
      { overlayX: 'end', overlayY: 'top' },
      0, 8
    ),
    new ConnectionPositionPair(
      { originX: 'end', originY: 'top' },
      { overlayX: 'end', overlayY: 'bottom' },
      0, -8
    ),
    new ConnectionPositionPair(
      { originX: 'start', originY: 'bottom' },
      { overlayX: 'start', overlayY: 'top' },
      0, 8
    )
  ];

  @Input() 
  set isOpen(value: boolean) {
    if (value) {
      this.open();
    } else if (this.isRendered) {
      this.close();
    }
  }

  get isOpen(): boolean {
    return this.isVisible;
  }

  open() {
    this.isRendered = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.isVisible = true;
      this.cdr.markForCheck();
    }, 10);
  }

  toggle() {
    if (this.isVisible) {
      this.close();
    } else {
      this.open();
    }
  }

  close() {
    this.isVisible = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.isRendered = false;
      this.cdr.markForCheck();
    }, 200);
  }
}

@Component({
  selector: 'app-dropdown-item',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class DropdownItemComponent {
  @Input() destructive = false;
  @Input() userClass: string = '';

  @HostBinding('class')
  get hostClasses(): string {
    const base = 'relative flex cursor-default select-none items-center rounded-sm px-2.5 py-2 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer';
    const destructiveCls = this.destructive ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 focus:text-red-600' : 'text-foreground';
    return `${base} ${destructiveCls} ${this.userClass}`;
  }
}

@Component({
  selector: 'app-dropdown-label',
  standalone: true,
  template: `<ng-content></ng-content>`,
})
export class DropdownLabelComponent {
  @HostBinding('class')
  get hostClasses(): string {
    return 'px-2.5 py-2 text-sm font-semibold text-foreground/90';
  }
}

@Component({
  selector: 'app-dropdown-separator',
  standalone: true,
  template: '',
})
export class DropdownSeparatorComponent {
  @HostBinding('class')
  get hostClasses(): string {
    return '-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-800 block';
  }
}
