import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-complaint-forms-a',
    templateUrl: './complaint-forms-a.component.html',
    styleUrls: ['./complaint-forms-a.component.scss'],
    standalone: false
})
export class ComplaintFormsAComponent implements OnInit {

  form: FormGroup;
  uploadedFiles: File[] = [];
  uploadedFiles2: File[] = [];
  isEditMode: boolean = false;
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
      howManyBags: ['', Validators.required],
      numberScholarships: ['', Validators.required],
      textarea1: ['', Validators.required],
      textarea2: ['', Validators.required],
      // radio1: [''],
      // radio2: [''],
      // radio3: [''],
      // textareaRadio2Sim: [''],
      // textareaRadio2Nao: [''],
      // textareaRadio3Sim: [''],
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
      textarea: 'Exemplo de texto para nota',
      radio1: 'sim',
      radio2: 'nao',
      radio3: 'sim',
      howManyBags: '200',
      numberScholarships: '300',
      textareaRadio2Sim: 'Exemplo de texto para nota',
      textareaRadio2Nao: 'Exemplo de texto para nota',
      textareaRadio3Sim: 'Exemplo de texto para nota',
    };

    this.form.patchValue(formData);
  }

  onFileSelect2(event: any): void {
    const files = event.target.files;
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        this.uploadedFiles2.push(files[i]);
      }
    }
  }

  submit() {
    console.log('ney')
    if(this.isEditMode) {
      this.toastrService.success('', 'Sucesso!', {progressBar: true, timeOut: 2000})
    } else {
    this.router.navigate(['/logged/new-complaint-step2'])
    }
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
    if (this.radio1 == '' || this.form.controls['textarea'].invalid || this.form.controls['howManyBags'].invalid || this.form.controls['numberScholarships'].invalid) {
      return true
    }
    if (this.radio1 == 'Sim') {
      if (this.uploadedFiles.length == 0) return true
      else return false
    }
    if (this.radio1 == 'Não') {
      if (this.radio2 == 'Não') {
        if (this.radio3 == '') return true
        else return false
      }
      if (this.radio2 == 'Sim') {
        if (this.radio3 == '' || this.form.controls['textarea1'].invalid) return true
        else return false
      }
      else return true
    }
    return false
  }

  @ViewChild('inputFile') inputFile?: ElementRef
  openFilesPage() {
    this.inputFile?.nativeElement.click()
  }

  @ViewChild('inputFile2') inputFile2?: ElementRef
  openFilesPage2() {
    this.inputFile2?.nativeElement.click()
  }

  putOnUploadedFiles(event: any) {
    if (event.target.files[0]) {
      this.uploadedFiles.push(event.target.files[0])
    }
    console.log(this.uploadedFiles)
  }

  putOnUploadedFiles2(event: any) {
    if (event.target.files[0]) {
      this.uploadedFiles2.push(event.target.files[0])
    }
    console.log(this.uploadedFiles2)
  }

  removeFile(i: number) {
    this.uploadedFiles = this.uploadedFiles.slice(0, i).concat(this.uploadedFiles.slice(i + 1));
  }

  removeFile2(i: number) {
    this.uploadedFiles2 = this.uploadedFiles2.slice(0, i).concat(this.uploadedFiles2.slice(i + 1));
  }

}