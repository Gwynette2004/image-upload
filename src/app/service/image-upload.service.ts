import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private baseUrl = 'http://localhost/ImageApi/modules';

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
    const url = `http://localhost/ImageApi/modules/delete.php?id=${id}`;
    return this.http.delete(url);
  }
}