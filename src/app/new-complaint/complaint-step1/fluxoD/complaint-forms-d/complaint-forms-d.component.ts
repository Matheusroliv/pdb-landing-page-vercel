import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-complaint-forms-d',
    templateUrl: './complaint-forms-d.component.html',
    styleUrls: ['./complaint-forms-d.component.scss'],
    standalone: false
})
export class ComplaintFormsDComponent implements OnInit {

  form: FormGroup;
  uploadedFiles: File[] = [];
  isEditMode = false;
  radio1: string = ''
  radio2: string = ''
  radio3: string = ''
  radio4: string = ''
  radio5: string = ''
  radio6: string = ''

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: ToastrService,
  ) {
    this.form = this.fb.group({
      textareaRadio6Sim: ['', Validators.required],
      textarea: ['', Validators.required],
    })
  }

  ngOnInit() { }

  ionViewDidEnter() {
    this.route.queryParams.subscribe(params => {
      this.isEditMode = params['mode'] === 'edit';

      if (this.isEditMode) {
        this.loadFormData();
      }
    });
  }

  loadFormData() {
    const formData = {
      radio1: 'sim',
      radio2: 'nao',
      radio3: 'sim',
      radio4: 'nao',
      radio5: 'sim',
      radio6: 'sim',
      textareaRadio6Sim: 'Exemplo de texto para nota',
      textarea: 'Relato sobre tratamento entre bolsistas e pagantes',
    };

    this.form.patchValue(formData);
  }

  markRadio1(s: string) {
    this.radio1 = s
  }

  markRadio2(s: string) {
    this.radio2 = s
  }

  markRadio3(s: string) {
    this.radio3 = s
  }

  markRadio4(s: string) {
    this.radio4 = s
  }

  markRadio5(s: string) {
    this.radio5 = s
  }

  markRadio6(s: string) {
    this.radio6 = s
    console.log(this.radio6)
  }

  formInvalid() {
    if (this.radio1 == '' || this.radio2 == '' || this.radio3 == '' || this.radio4 == '' || this.radio5 == '') return true
    if (this.radio6 == '') return true
    if (this.radio6 == 'Sim') {
      if (this.form.controls['textareaRadio6Sim'].invalid || this.form.controls['textarea'].invalid) return true
      return false
    }
    if (this.radio6 == 'Não') {
      if (this.form.controls['textarea'].invalid) return true
      return false
    }
    return false
  }

}