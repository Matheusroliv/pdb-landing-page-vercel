import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-complaint-forms-b',
    templateUrl: './complaint-forms-b.component.html',
    styleUrls: ['./complaint-forms-b.component.scss'],
    standalone: false
})
export class ComplaintFormsBComponent implements OnInit {

  form: FormGroup;
  uploadedFiles: File[] = [];
  isEditMode: boolean = false;
  radio1: string = ''
  radio2: string = ''
  radio3: string = ''
  radio4: string = ''
  radio5: string = ''


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
      namesOfInvolved: ['', Validators.required],
      responsibilityOfInvolved: ['', Validators.required],
      namesWitnesses: ['', Validators.required],
      contactsWitnesses: ['', Validators.required],
      textareaRadio3Sim: ['', Validators.required],
      textareaRadio3Nao: ['', Validators.required],
      textareaRadio4Sim: ['', Validators.required],
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
      when: 'Semana passada',
      where: 'Na minha escola, Porto Seguro',
      radio1: 'sim',
      namesOfInvolved: 'Rick Sanchez',
      responsibilityOfInvolved: 'Professor de ciências',
      namesWitnesses: 'Morty Smith',
      contactsWitnesses: 'mortysmith@gmail.com',
      radio2: 'sim',
      radio3: 'isolado',
      radio4: 'sim',
      textareaRadio3Sim: 'Exemplo de texto para nota',
      textareaRadio4Sim: 'Exemplo de texto para nota',
    };

    this.form.patchValue(formData);
  }

  submit() {
    if (this.isEditMode) {
      this.toastrService.success('', 'Sucesso!', { progressBar: true, timeOut: 2000 })
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

  markRadio4(s: string) {
    this.radio4 = s
  }

  markRadio5(s: string) {
    this.radio5 = s
  }

  @ViewChild('inputFile') inputFile?: ElementRef
  openFilesPage() {
    this.inputFile?.nativeElement.click()
  }

  removeFile(i: number) {
    this.uploadedFiles = this.uploadedFiles.slice(0, i).concat(this.uploadedFiles.slice(i + 1));
  }

  formInvalid() {
    if (this.form.controls['textarea'].invalid || this.form.controls['when'].invalid || this.form.controls['where'].invalid || this.radio1 == '') {
      return true
    }
    if (this.radio1 == 'Sim') {
      if (this.form.controls['namesOfInvolved'].invalid || this.form.controls['responsibilityOfInvolved'].invalid) return true
      return false
    }
    if (this.radio1 == 'Não') {
      if (this.radio2 == 'Não') return false
      if (this.radio2 == '') return true
      else {
        if (this.form.controls['namesWitnesses'].invalid || this.form.controls['contactsWitnesses'].invalid) return true
        else {
          if (this.radio3 == 'Sim') {
            if (this.radio4 == '' || this.form.controls['textareaRadio3Sim'].invalid || this.radio5 == '') return true
            return false
          } 
          if (this.radio3 == 'Não') {
            if (this.radio4 == '' || this.form.controls['textareaRadio3Nao'].invalid || this.radio5 == '') return true
            return false
          }
          if (this.radio3 == '') return true
        }
      }
    }
    return false
  }

  putOnUploadedFiles(event: any) {
    if (event.target.files[0]) {
      this.uploadedFiles.push(event.target.files[0])
    }
    console.log(this.uploadedFiles)
  }

}