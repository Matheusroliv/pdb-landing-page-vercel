import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PreRegisterDto, UserService } from '../service/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OpenPreRegistrationModalService } from '../service/open-pre-registration-modal.service';

@Component({
    selector: 'app-pre-registration-modal',
    templateUrl: './pre-registration-modal.component.html',
    styleUrls: ['./pre-registration-modal.component.scss'],
    standalone: false
})
export class PreRegistrationModalComponent {

  step1 = true;
  step2 = false;

  @Output() closeModal = new EventEmitter<void>();

  formModalRespond: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private openPreRegistrationModalService: OpenPreRegistrationModalService
  ) {
    this.formModalRespond = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      acceptUpdates: [false, Validators.requiredTrue]
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.formModalRespond.valid) {
      const data: PreRegisterDto = {
        email: this.formModalRespond.value.email,
        phone: this.formModalRespond.value.telefone
      };

      this.userService.preRegister(data).subscribe({
        next: () => {
          this.step1 = false;
          this.step2 = true;
          this.toastr.success('Pré-cadastro realizado com sucesso!');
        },
        error: () => {
          this.toastr.error('Ocorreu um erro. E-mail ou telefone já cadastrado.');
        }
      });
    }
  }

  close() {
    this.modalService.dismissAll()
    this.openPreRegistrationModalService.setData(false)
  }

  teste() {
    console.log(this.formModalRespond.controls['acceptUpdates'].value)
  }
}
