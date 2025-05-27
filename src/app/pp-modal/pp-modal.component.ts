import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-pp-modal',
    templateUrl: './pp-modal.component.html',
    styleUrls: ['./pp-modal.component.scss'],
    standalone: false
})
export class PpModalComponent implements OnInit {
  
  constructor(
    private modalService: NgbModal,
  ) {
    
   }

  ngOnInit(): void {
  }
  
  closeModal() {
    this.modalService.dismissAll()
  }
}
