import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class SomeFullModalIsOpenService {
    
    private data = new BehaviorSubject<boolean>(false);
    currentData = this.data.asObservable();
    setCurrentData(b: boolean) {
        this.data.next(b);
    }


}