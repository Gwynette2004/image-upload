import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, RouterLink, Router } from '@angular/router';
import { ImageUploadService } from '../service/image-upload.service';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterOutlet, RouterModule, RouterLink, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  email: string = '';
  password: string = '';
  username: string = '';
  errorMessage: string = ''; // To store error message

  constructor(private imageuploadService: ImageUploadService, private router: Router) { }

  onSignup(): void {
    // this.router.navigate(['/homepage']);  
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    const data = {
      email: this.email,
      password: this.password,
      username: this.username
    };
    console.log(data);

    this.imageuploadService.userSignUp(data).subscribe(
      (response: any) => {
        console.log('Signup Successful.', response);
        if (response.status === 'success') {
          this.router.navigate(['/login']);
        } else {
          alert('There is an error, try again!');
        }
      },
      (error: any) => {
        if (error.status === 401) {
          alert('Email or Password is Incorrect.');
        } else {
          alert('An unexpected error occurred. Please try again later.');
        }
      }
    );
  }
}
