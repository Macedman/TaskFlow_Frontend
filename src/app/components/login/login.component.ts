import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email = new FormControl('');
  password = new FormControl('');

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    const email = this.email.value || '';
    const password = this.password.value || '';
    console.log(email, password);

    this.authService.login(email, password).subscribe((response) => {
      console.log(response);
      //save the token to local storage
      localStorage.setItem('Bearer ', response.token);
      this.router.navigate(['/board']);
    }, (error) => {
      console.log("Error logging in: ", error);
    });
  }

  //
}
