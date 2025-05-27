import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ShareInstitutionService {
    
    private shareInstitutionService = new BehaviorSubject<any>([])
    shareInstitution = this.shareInstitutionService.asObservable()
    setShareInstitution(a: any) {
        this.shareInstitutionService.next(a)
    }

}