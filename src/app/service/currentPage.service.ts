import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class currentPageService {

    private data = new BehaviorSubject<any>("anythink");

    currentData = this.data.asObservable();

    setCurrentData(newPage: any) {
        this.data.next(newPage);
    }

}