import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-location-prompt',
  templateUrl: './modal-location-prompt.component.html',
  styleUrls: ['./modal-location-prompt.component.scss'],
  standalone: false

})
export class ModalLocationPromptComponent {
  constructor(public activeModal: NgbActiveModal) { }

  allowLocation(): void {
    this.activeModal.close(true);
  }

  denyLocation(): void {
    this.activeModal.close(false);
  }
}
