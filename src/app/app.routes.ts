import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { Component } from '@angular/core';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { SignupComponent } from './signup/signup.component';
import { RouterModule } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'main', component: ImageUploadComponent},
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent }

];
