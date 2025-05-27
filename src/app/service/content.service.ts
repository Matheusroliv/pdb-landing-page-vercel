import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment.dev';

@Injectable({
  providedIn: 'root'
})
export class ContentService extends BaseService {
  api: string = `${environment.api.path}/content`;

  constructor(private http: HttpClient) {
    super();
  }

  listAllLandingPage(): Observable<any> {
    return this.http
      .get(`${this.api}/list-all-landing-page`, this.authorizedHeader())
      .pipe(map(this.extractData), catchError(this.serviceError));
  }

  get(id: string): Observable<any> {
    return this.http
      .get(`${this.api}/find-by-id/${id}`, this.authorizedHeader())
      .pipe(map(this.extractData), catchError(this.serviceError));
  }
}
