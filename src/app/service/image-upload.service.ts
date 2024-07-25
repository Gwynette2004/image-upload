import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private baseUrl = 'http://localhost/ImageApi';

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<any> {
  const formData: FormData = new FormData();
  formData.append('image', file);

  return this.http.post(`${this.baseUrl}/addimage`, formData, {
    reportProgress: true,
    observe: 'events',
    responseType: 'json'
  })
}

  getFiles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getimages`).pipe(
      catchError(error => {
        console.error('Fetch error:', error);
        return throwError(error);
      })
    );
  }

  deleteImage(id: number): Observable<any> {
    const url = `http://localhost/ImageApi/delete?id=${id}`;
    console.log('Sending delete request to:', url);
    return this.http.delete(url);
  }

  userLogin(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, data)
      .pipe(
        tap((response: any) => {
          console.log('userLogin response:', response);
          // Handle storing user_id in the component where this method is called
        }),
        catchError(this.handleError)
      );
  }
      // return this.http.post(`${this.baseUrl}/addimage`, formData, {
      //   reportProgress: true,
      //   observe: 'events',
      //   responseType: 'json'
      // })


      updateImage(data: { imageId: number; filter: string; rotation: number }): Observable<any> {
        console.log('Sending update image request:', data); // Log the request data
        return this.http.post<any>(`${this.baseUrl}/updateimage`, data);
      }

  userSignUp(data: any): Observable<any> {
    console.log(`${this.baseUrl}/signup`)
    return this.http.post<any>(`${this.baseUrl}/signup`, data)
      .pipe(
        tap(response => {
          console.log('userSignUp response:', response);
        }),
        catchError(this.handleError)
      );
  }

  getUpdatedImage(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/getupdatedimage/${id}`, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.error('Fetch updated image error:', error);
        return throwError(error);
      })
    );
  }
  
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error occurred.
      console.error('An error occurred:', error.error.message);
    } else {
      // Backend returned an unsuccessful response code.
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }
}