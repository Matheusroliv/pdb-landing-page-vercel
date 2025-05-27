import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from '../../environments/environment.dev';
import { Observable, map, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentCommentService extends BaseService {
  api: string = `${environment.api.path}/student-comment`;

  constructor(private http: HttpClient) {
    super();
  }

  listAll(): Observable<any> {
    return this.http
      .get(`${this.api}/list-all`, this.authorizedHeader())
      .pipe(map(this.extractData), catchError(this.serviceError));
  }

  getById(id: string): Observable<any> {
    return this.http
      .get(`${this.api}/find-by-id/${id}`, this.authorizedHeader())
      .pipe(map(this.extractData), catchError(this.serviceError));
  }

}
