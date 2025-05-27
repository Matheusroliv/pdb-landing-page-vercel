import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class MenuMobileService {
    
    private menuProperty = new BehaviorSubject<any>(false);
    menu = this.menuProperty.asObservable();
    setMenu(b: boolean) {
        this.menuProperty.next(b);
    }

    private downloadProperty = new BehaviorSubject<any>(false);
    download = this.downloadProperty.asObservable();
    setDownload(b: boolean) {
        this.downloadProperty.next(b);
    }

    private registerMobile = new BehaviorSubject<any>(false);
    registerModalMobile = this.registerMobile.asObservable();
    setRegisterModalMobile(b: boolean) {
        this.registerMobile.next(b);
    }

}