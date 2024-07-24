import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule, RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ImageUploadService } from '../service/image-upload.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, RouterModule, RouterOutlet, FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']  // Make sure this is 'styleUrls' instead of 'styleUrl'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = ''; // To store error message
  currentUserId: number | null = null;

  constructor(private imageuploadService: ImageUploadService , private router: Router) {}

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }
  
    const data = {
      email: this.email,
      password: this.password
    };
  
    this.imageuploadService.userLogin(data).subscribe(
      (response: any) => {
        console.log('Login Successful.', response);
        if (response.status.remarks === 'success') {
          const userId = response.payload.user_id;
          sessionStorage.setItem('currentUserId', userId.toString());
          this.router.navigate(['/main']);
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