import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';

export interface OperationalConfig {
  cutoffHour: number;
  cutoffMinute: number;
  unattendedThresholdMinutes: number;
  waitingDishesThresholdMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class OperationalConfigApi extends BaseApiService {

  getConfig(): Observable<OperationalConfig> {
    return this.http.get<OperationalConfig>(`${this.baseUrl}/operational-configs`);
  }

  updateConfig(config: OperationalConfig): Observable<OperationalConfig> {
    return this.http.put<OperationalConfig>(`${this.baseUrl}/operational-configs`, config);
  }
}
