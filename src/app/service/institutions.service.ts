import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment.dev';
import { BaseService } from './base.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { InstitutionQuery, sortType } from '../map-session/interface-query';

@Injectable({
  providedIn: 'root'
})
export class InstitutionsService extends BaseService {
  private readonly api = `${environment.api.path}`;

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  listInstitutions(
    page: number,
    limit: number,
    sort: sortType,
    query: InstitutionQuery
  ): Observable<{
    data: any[];
    totalCount: number;
    hasMore: boolean
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sort', sort);

    for (const [key, value] of Object.entries(query)) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      ) {
        continue;
      }

      switch (key) {
        case 'name':
        case 'cnpj':
        case 'zipCode':
        case 'city':
        case 'address':
        case 'state':
        case 'juridicName':
        case 'type':
        case 'academicOrganization':
        case 'openingdateBegin':
        case 'openingdateEnd':
        case 'educationLevelSource':
        case 'scholarshipPolicy':
          params = params.set(key, String(value));
          break;
        case 'rating':
          params = params.set(key, Number(value).toString());
          break;
        case 'coordinates':
          try {
            params = params.set(key, JSON.stringify(value));
          } catch (e) {
            console.warn(`Invalid coordinates format: ${value}`);
          }
          break;
        case 'acessibility':
          params = params.set(key, (value as string[]).join(','));
          break;
        case 'phone':
        case 'email':
        case 'site':
          if (value === true) params = params.set(key, 'true');
          break;
        default:
          console.warn(`Unknown query parameter: ${key}`);
      }
    }

    console.log('Query params sent:', params.toString());

    return this.httpClient
      .get<{ data: any[]; totalCount: number }>(`${this.api}/institutions`, {
        headers: this.anonymousHeader().headers,
        params,
      })
      .pipe(
        map(response => {
          const data = this.extractData(response).data;
          const totalCount = this.extractData(response).totalCount;
          const hasMore = page * limit < totalCount;
          return { data, totalCount, hasMore };
        }),
        catchError(err => {
          console.error('Error loading institutions:', {
            status: err.status,
            message: err.message,
            error: err.error,
          });
          return throwError(() => new Error('Failed to load institutions'));
        })
      );
  }

  getInstitutionById(id: string) {
    return this.httpClient
      .get(`${this.api}/institutions/by-id/${id}`, {
        headers: this.anonymousHeader().headers,
      })
      .pipe(
        map(this.extractData),
        catchError(err => {
          throw new Error('Erro ao carregar instituição por ID: ' + err.message);
        })
      );
  }

  listCities(): Observable<{ display: string; city: string; state: string }[]> {
    return this.httpClient
      .get<{ success: boolean; data: { city: string; uf: string }[] }>(`${this.api}/institutions/list-cities`, {
        headers: this.anonymousHeader().headers,
      })
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error('Falha ao carregar cidades');
          }
          return response.data
            .map(item => ({
              display: `${item.city}, ${item.uf}`,
              city: item.city,
              state: item.uf,
            }))
            .sort((a, b) => a.display.localeCompare(b.display, 'pt-BR'));
        }),
        catchError(err => {
          throw new Error('Erro ao carregar cidades: ' + err.message);
        })
      );
  }

  async getCoordinatesFromZipCode(zipCode: string): Promise<[number, number] | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&country=BR&postalcode=${zipCode}`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          return [parseFloat(lon), parseFloat(lat)];
        }
        return null;
      } catch (error) {
        console.error(`Attempt ${attempt} failed to fetch coordinates`, error);
        if (attempt === 3) {
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return null;
  }
}
