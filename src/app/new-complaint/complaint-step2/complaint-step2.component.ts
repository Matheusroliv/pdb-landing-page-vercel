import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-complaint-step2',
    templateUrl: './complaint-step2.component.html',
    styleUrls: ['./complaint-step2.component.scss'],
    standalone: false
})
export class ComplaintStep2Component implements OnInit {

  form: FormGroup

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.form = this.fb.group({
      textarea: ['', Validators.required],
      textarea2: ['', Validators.required],
    })
   }

  ngOnInit() { }

  formInvalid() {
    if (this.form.controls['textarea'].invalid || this.form.controls['textarea2'].invalid) return true
    return false
  }

}