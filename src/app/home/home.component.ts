import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  inputForm!: FormGroup;
  constructor(private router: Router) { }

  ngOnInit(): void {
    this.inputForm = new FormGroup({
      input: new FormControl('', [Validators.required, Validators.minLength(5)])
    })
  }

  joinChannel() {
    const queryParams = { room: this.inputForm?.get('input')?.value};
    this.router.navigate(['/chat'], { queryParams });
  }
}
