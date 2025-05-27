import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs';
import { BaseService } from './base.service';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ReviewsService extends BaseService {
  api: string = `${environment.api.path}/reviews`;

  constructor(private http: HttpClient) {
    super();
  }

  getReviewByInstitutionId(institutionId: string) {
    return this.http
      .get(`${this.api}/institution/${institutionId}?institutionId=${institutionId}`, this.anonymousHeader())
      .pipe(map(this.extractData), catchError(this.serviceError));
  }

  getAverageRating(institutionId: string) {
    return this.http
      .get(`${this.api}/average-rating/${institutionId}`, this.anonymousHeader())
      .pipe(map(this.extractData), catchError(this.serviceError));
  }
}
