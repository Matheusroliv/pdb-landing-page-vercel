import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { currentPageService } from '../../service/currentPage.service';

@Component({
    selector: 'app-complaint-step1',
    templateUrl: './complaint-step1.component.html',
    styleUrls: ['./complaint-step1.component.scss'],
    standalone: false
})
export class ComplaintStep1Component implements OnInit {

  form: FormGroup
  radio1: string = ""

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private currentPage: currentPageService
  ) {
    this.form = this.fb.group({
      institution: ['', Validators.required],
      typeComplaint: ['', Validators.required],
      specifyComplaint: [''],
    })
  }

  ngOnInit() { 
    this.currentPage.setCurrentData('none')
   }

  submit() {
    const response = this.form.controls['typeComplaint'].value;
    console.log(response)
    if (response == 'fluxoA') {
      this.router.navigate(['/new-complaint-forms-A'], {queryParams: {mode: 'create'}})
    } else if (response == 'fluxoB') {
      this.router.navigate(['/new-complaint-forms-B'], {queryParams: {mode: 'create'}})
    } else if (response == 'fluxoC') {
      this.router.navigate(['/new-complaint-forms-C'], {queryParams: {mode: 'create'}})
    } else if (response == 'fluxoD') {
      this.router.navigate(['/new-complaint-forms-D'], {queryParams: {mode: 'create'}});
    } else {
      this.router.navigate(['/new-complaint-forms-E'], {queryParams: {mode: 'create'}})
    }
  }

  markRadio1(s: string) {
    this.radio1 = s
  }

}