import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-complaint-forms-e',
    templateUrl: './complaint-forms-e.component.html',
    styleUrls: ['./complaint-forms-e.component.scss'],
    standalone: false
})
export class ComplaintFormsEComponent  implements OnInit {

  form: FormGroup;
  uploadedFiles: File[] = [];
  isEditMode = false;
  radio1: string = ''
  radio2: string = ''
  radio3: string = ''

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: ToastrService,
  ) {
    this.form = this.fb.group({
      textarea: ['', Validators.required],
      when: ['', Validators.required],
      where: ['', Validators.required],
      textareaRadio2Sim: ['', Validators.required],
      textareaRadio2Nao: ['', Validators.required],
      textareaRadio3Sim: [''],
    })
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.isEditMode = params['mode'] === 'edit';

      if (this.isEditMode) {
        this.loadFormData();
      }
    });
  }

  loadFormData() {
    const formData = {
      when: 'It is a long established fact',
      where: 'It is a long established fact',
      radio: 'sim',
      radio1: 'souEstudante',
      radio2: 'sim',
      radio3: 'sim',
      textarea: 'Exemplo de texto para nota.',
      textareaRadio2Sim: 'Exemplo de texto para nota.',
      textareaRadio3Sim: 'Exemplo de texto para nota.',
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

  formInvalid() {
    if (this.form.controls['textarea'].invalid || this.form.controls['when'].invalid || this.form.controls['where'].invalid || this.radio1 == '') {
      return true
    }
    if (this.radio2 == '') return true
    if (this.radio2 == 'Sim' && (this.form.controls['textareaRadio2Sim'].invalid || this.radio3 == '')) return true
    if (this.radio2 == 'Não' && (this.form.controls['textareaRadio2Nao'].invalid || this.radio3 == '')) return true
    return false
  }

  @ViewChild('inputFile') inputFile?: ElementRef
  openFilesPage() {
    this.inputFile?.nativeElement.click()
  }

  removeFile(i: number) {
    this.uploadedFiles = this.uploadedFiles.slice(0, i).concat(this.uploadedFiles.slice(i + 1));
  }
  
  putOnUploadedFiles(event: any) {
    if (event.target.files[0]) {
      this.uploadedFiles.push(event.target.files[0])
    }
    console.log(this.uploadedFiles)
  }

}