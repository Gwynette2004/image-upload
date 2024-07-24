import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private apiUrl = 'http://localhost/ImageApi'; // Adjust if necessary

  constructor(private http: HttpClient) { }
  
  postComment(commentData: { id: number; comment: string; user_id: number }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
  
    return this.http.post(`${this.apiUrl}/postcomment`, commentData, { headers });
  }
  
  getComments(imageId: number): Observable<any> {
    // Ensure this matches your API's expected endpoint
    return this.http.get(`${this.apiUrl}/fetchcomments/?image_id=${imageId}`);
  }

}
