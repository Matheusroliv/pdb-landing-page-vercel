import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';""

@Component({
    selector: 'app-complaint-step3',
    templateUrl: './complaint-step3.component.html',
    styleUrls: ['./complaint-step3.component.scss'],
    standalone: false
})
export class ComplaintStep3Component  implements OnInit {

  radio: boolean = false

  constructor(
    private router: Router,
  ) {}

  ngOnInit() {}

  submit() {
    this.router.navigate(['/logged/home']);
  }

  changeRadio() {
    if (this.radio) this.radio = false
    else this.radio = true
  }

}