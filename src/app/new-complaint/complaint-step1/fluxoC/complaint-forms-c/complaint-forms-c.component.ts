import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { retry } from 'rxjs';

@Component({
    selector: 'app-complaint-forms-c',
    templateUrl: './complaint-forms-c.component.html',
    styleUrls: ['./complaint-forms-c.component.scss'],
    standalone: false
})
export class ComplaintFormsCComponent implements OnInit {

  form: FormGroup;
  uploadedFiles: File[] = [];
  isEditMode: boolean = false;
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
      textarea: ['', Validators.required],
      textareaRadio4Sim: ['', Validators.required],
      input: ['', Validators.required],
      radio6: ['', Validators.required],
      textareaRadio6Sim: ['', Validators.required]
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
      input: 'Há 4 anos',
      radio: 'sim',
      radio1: 'souEstudante',
      radio2: 'sim',
      radio3: 'sim',
      radio4: 'sim',
      radio5: 'sim',
      radio6: 'sim',
      textarea: 'Exemplo de texto para nota',
      textareaRadio4Sim: 'Exemplo de texto para nota',
      textareaRadio6Sim: 'Exemplo de texto para nota',
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
  }

  formInvalid() {
    if (this.radio1 == '' || this.form.controls['textarea'].invalid || this.radio2 == '' || this.radio3 == '') return true
    if (this.radio4 == '') return true
    if (this.radio4 == 'Sim' && (this.form.controls['textareaRadio4Sim'].invalid || this.radio5 == '' || this.radio6 == '' || this.form.controls['input'].invalid)) return true
    if ((this.radio4 == 'Não' || this.radio4 == 'Não sei') && (this.radio5 == '' || this.form.controls['input'].invalid || this.radio6 == '' )) return true
    return false
  }

  @ViewChild('inputFile') inputFile?: ElementRef
  openFilesPage() {
    console.log('ney')
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