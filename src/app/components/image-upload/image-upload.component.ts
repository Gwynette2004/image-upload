import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { ImageUploadService } from '../../service/image-upload.service';
import { map } from 'rxjs/operators';  
import { ImageEditorModule } from '../../image-editor/image-editor.module';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, ImageEditorModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent implements OnInit {
  currentFile?: File;
  message = '';
  preview = '';
  imageInfos?: Observable<any[]>;  
  selectedImage: string | null = null;  

  constructor(private uploadService: ImageUploadService) {}

  selectFile(event: any): void {
    this.message = '';
    const selectedFiles = event.target.files;

    if (selectedFiles) {
      const file: File | null = selectedFiles.item(0);
      if (file) {
        this.currentFile = file;

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.preview = e.target.result;
        };
        reader.readAsDataURL(this.currentFile);
      }
    }
  }

  upload(): void {
    if (this.currentFile) {
      this.uploadService.upload(this.currentFile).subscribe({
        next: (event: any) => {
          if (event instanceof HttpResponse) {
            this.message = event.body.message;
            this.refreshImageList();
          }
        },
        error: (err: any) => {
          this.message = err.error?.message || 'Could not upload the image!';
        },
        complete: () => {
          this.currentFile = undefined;
        }
      });
    }
  }

  ngOnInit(): void {
    this.refreshImageList(); 
  }

  refreshImageList(): void {
    this.imageInfos = this.uploadService.getFiles().pipe(
      map(response => {
        return response.data;  
      })
    );
  }

  deleteImage(id: number): void {
    this.uploadService.deleteImage(id).subscribe({
      next: (response) => {
        this.refreshImageList(); 
      },
      error: (err) => {
        this.message = err.error?.message || 'Could not delete the image!';
      }
    });
  }

  openPreview(imgUrl: string): void {
    this.selectedImage = imgUrl;  
  }
  
  closePreview(): void {
    this.selectedImage = null;  
  }

  cancel(): void {
    this.currentFile = undefined; 
    this.preview = ''; 
    this.message = ''; 
  }
}