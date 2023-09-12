import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import * as uuid from 'uuid';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
  ],
})
export class HomeComponent implements OnInit {
  inputForm!: FormGroup;
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.inputForm = new FormGroup({
      input: new FormControl('', [
        Validators.required
      ]),
    });
  }

  joinChannel() {
    const queryParams = { room: this.inputForm?.get('input')?.value };
    this.router.navigate(['/chat'], { queryParams });
  }

  startMeeting() {
    const queryParams = { room: uuid.v4().slice(0,8)};
    this.router.navigate(['/chat'], { queryParams });
  }
}
