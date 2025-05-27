import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class getAddressByCepService {
  private apiUrl = 'https://viacep.com.br/ws/';

  constructor(private http: HttpClient) {}

  buscarCep(cep: string): Observable<any> {
    const url = `${this.apiUrl}${cep}/json/`;
    return this.http.get(url);
  }
}