import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/http/base-api.service';
import { Observable } from 'rxjs';

export interface LookupResult {
  documentNumber: string;
  name: string;
  address: string;
  success: boolean;
}

@Injectable({ providedIn: 'root' })
export class LookupApi extends BaseApiService {

  lookupDni(dni: string): Observable<LookupResult> {
    return this.http.get<LookupResult>(`${this.baseUrl}/lookup/dni/${dni}`);
  }

  lookupRuc(ruc: string): Observable<LookupResult> {
    return this.http.get<LookupResult>(`${this.baseUrl}/lookup/ruc/${ruc}`);
  }
}
