import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map, catchError, Observable } from "rxjs";
import { BaseService } from "./base.service";
import { environment } from "../../environments/environment.prod";

export interface PreRegisterDto {
  email: string;
  phone: string;
}

@Injectable()
export class UserService extends BaseService {
  url: string = `${environment.api.path}/user-client`;

  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  preRegister(dto: PreRegisterDto): Observable<any> {

    return this.httpClient
      .post(`${this.url}/pre-register`, dto, this.anonymousHeader())
      .pipe(
        map(this.extractData),
        catchError(this.serviceError)
      );
  }
}
