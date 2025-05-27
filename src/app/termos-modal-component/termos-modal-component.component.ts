import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-termos-modal-component',
    imports: [],
    templateUrl: './termos-modal-component.component.html',
    styleUrl: './termos-modal-component.component.scss'
})
export class TermosModalComponentComponent implements OnInit {
 

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