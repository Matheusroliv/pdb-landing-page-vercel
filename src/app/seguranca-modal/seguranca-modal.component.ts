import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-seguranca-modal',
    imports: [],
    templateUrl: './seguranca-modal.component.html',
    styleUrl: './seguranca-modal.component.scss'
})
export class SegurancaModalComponent implements OnInit {
  
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