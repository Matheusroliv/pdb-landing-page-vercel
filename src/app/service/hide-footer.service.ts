import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class hideFooterService {

    private hideFooterService = new BehaviorSubject<boolean>(false);

    hidefooter = this.hideFooterService.asObservable();

    changeHidefooter(b: boolean) {
      this.hideFooterService.next(b);
    }

}