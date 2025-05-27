import { Component, OnInit } from '@angular/core';
import { SomeFullModalIsOpenService } from '../service/someFullModalIsOpen.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PpModalComponent } from '../pp-modal/pp-modal.component';
import { TermosModalComponentComponent } from '../termos-modal-component/termos-modal-component.component';
import { SegurancaModalComponent } from '../seguranca-modal/seguranca-modal.component';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent implements OnInit {
  
  openModalPp(){
    this.modalService.open(PpModalComponent)

  }
  openModalTermosDeUso(){
    this.modalService.open(TermosModalComponentComponent)
  }
  openModalSeguranca(){
    this.modalService.open(SegurancaModalComponent)
  }

  someFullModalIsOpen: boolean = false;

  constructor(private someFullModalIsOpenService: SomeFullModalIsOpenService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.someFullModalIsOpenService.currentData.subscribe(data => {
      this.someFullModalIsOpen = data;
    })
  }

}
