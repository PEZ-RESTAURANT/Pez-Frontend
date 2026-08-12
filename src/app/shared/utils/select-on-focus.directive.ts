import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'input[type="number"]',
  standalone: true
})
export class SelectOnFocusDirective {
  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('focus')
  onFocus(): void {
    // Select the content of the input on focus
    setTimeout(() => {
      if (this.el.nativeElement) {
        this.el.nativeElement.select();
      }
    }, 0);
  }
}
