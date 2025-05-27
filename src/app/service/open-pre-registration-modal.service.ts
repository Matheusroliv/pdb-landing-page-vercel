import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class OpenPreRegistrationModalService {
 
    private data = new BehaviorSubject<any>(null)

    currentData = this.data.asObservable()

    setData(newData: any) {
        this.data.next(newData)
    }

}