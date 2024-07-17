import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private baseUrl = 'http://localhost:3000/modules';  // Change this to your server URL

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<HttpEvent<any>> {
    const formData: FormData = new FormData();
    formData.append('image', file);  // Make sure the name matches 'image' in the PHP script

    const req = new HttpRequest('POST', `${this.baseUrl}/post.php`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req);
  }

  getFiles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get.php`);
  }

  deleteImage(id: number): Observable<any> {
    return this.http.delete(`http://localhost:3000/modules/delete.php?id=${id}`);
}



}
