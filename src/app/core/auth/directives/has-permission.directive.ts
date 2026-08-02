import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  private permissionCodeValue = '';
  private hasView = false;

  @Input()
  set hasPermission(code: string) {
    this.permissionCodeValue = code;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Depend on permissions signal to re-evaluate when permissions load/change
      this.permissionService.permissions$();
      this.updateView();
    });
  }

  private updateView() {
    if (!this.permissionCodeValue) return;
    
    const hasPerm = this.permissionService.hasPermission(this.permissionCodeValue);

    if (hasPerm && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPerm && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
