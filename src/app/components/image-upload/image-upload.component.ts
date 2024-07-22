import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { ImageUploadService } from '../../service/image-upload.service';
import { map } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('uploadedImage') uploadedImage!: ElementRef<HTMLImageElement>;

  currentFile: File | null = null;
  message = '';
  preview: string | null = null;
  imageInfos?: Observable<any[]>;
  selectedImage: string | null = null;
  croppedImage: SafeUrl | null = null;
  editing = false;
  isDragOver = false;
  rotation = 0;
  currentFilter: string = 'none'; // Initialize filter to 'none'

  private baseUrl: string = '';

  constructor(
    private uploadService: ImageUploadService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.refreshImageList();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  selectFile(event: Event): void {
    this.message = '';
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files.item(0);
      if (file) {
        this.currentFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.preview = e.target.result; // Set preview image
          this.editing = false;
          this.rotation = 0; // Reset rotation when a new file is selected
        };
        reader.readAsDataURL(this.currentFile);
      }
    }
  }
  
  

  rotateImage(): void {
    this.rotation += 90;
    if (this.uploadedImage) {
      this.uploadedImage.nativeElement.style.transform = `rotate(${this.rotation}deg)`;
    }
  }

  resetImage(): void {
    this.rotation = 0;
    if (this.uploadedImage) {
      this.uploadedImage.nativeElement.style.transform = `rotate(${this.rotation}deg)`;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.currentFile = event.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.preview = e.target.result;
        this.editing = false;
        this.rotation = 0; // Reset rotation when a new file is dropped
      };
      reader.readAsDataURL(this.currentFile);
    }
  }

  cancelEdit(): void {
    // Reset editing state
    this.editing = false;
    this.currentFile = null;
    this.preview = null;
    this.croppedImage = null;
    this.rotation = 0;
    this.currentFilter = 'none'; // Reset filter
  
    // Close any open modals
    this.closeModal('previewModal');
    this.closeModal('cropperModal'); // Ensure this modal is also closed
  }
  upload(): void {
    if (this.currentFile) {
      let fileToUpload = this.currentFile;
      if (this.croppedImage) {
        try {
          const dataURL = this.croppedImage.toString() || '';
          console.log('Cropped image data URL for upload:', dataURL);
        } catch (error) {
          console.error('Error converting cropped image to blob:', error);
          this.message = 'Failed to process cropped image.';
          return;
        }
      }
      this.uploadService.upload(fileToUpload).subscribe({
        next: (event: any) => {
          if (event instanceof HttpResponse) {
            this.message = event.body.message;
            this.refreshImageList();
          }
        },
        complete: () => {
          this.resetUploadState();
          window.location.reload();
        }
      });
    } else {
      this.message = 'No image has been selected.';
    }
  }

  getImageUrl(imageName: string): string {
    return `${this.baseUrl}${imageName}`;
  }

  refreshImageList(): void {
    this.imageInfos = this.uploadService.getFiles().pipe(
      map(response => response.data)
    );
  }

  deleteImage(id: number): void {
    this.uploadService.deleteImage(id).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.refreshImageList();
        } else {
          this.message = response.message || 'Could not delete the image!';
        }
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.message = err.error?.message || 'Could not delete the image!';
      }
    });
  }

  openPreview(imgUrl: string): void {
    this.selectedImage = imgUrl;
    this.rotation = 0; // Reset rotation when opening preview
    this.currentFilter = 'none'; // Reset filter when opening preview
    this.showModal('previewModal');
  }

  closePreview(): void {
    this.selectedImage = null;
    this.closeModal('previewModal');
  }

  rotatePreviewImage(): void {
    this.rotation += 90;
    const previewImage = document.querySelector('.preview-image') as HTMLImageElement;
    if (previewImage) {
      previewImage.style.transform = `rotate(${this.rotation}deg)`;
    }
  }

  resetPreviewImage(): void {
    this.rotation = 0;
    const previewImage = document.querySelector('.preview-image') as HTMLImageElement;
    if (previewImage) {
      previewImage.style.transform = `rotate(${this.rotation}deg)`;
    }
  }

  shareImage(): void {
    if (this.selectedImage) {
      if (navigator.share) {
        navigator.share({
          title: 'Shared Image',
          text: 'Check out this image!',
          url: this.selectedImage
        }).then(() => {
          console.log('Image shared successfully');
        }).catch((error) => {
          console.error('Error sharing image:', error);
        });
      } else {
        alert('Sharing is not supported on this browser.');
      }
    } else {
      alert('No image selected for sharing.');
    }
  }

  applyFilter(filter: string): void {
    this.currentFilter = filter;
  }

  private showModal(modalId: string): void {
    const modal = document.getElementById(modalId) as HTMLElement;
    if (modal) {
      modal.style.display = 'block';
    }
  }

  private closeModal(modalId: string): void {
    const modal = document.getElementById(modalId) as HTMLElement;
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private resetUploadState(): void {
    this.currentFile = null;
    this.editing = false;
    this.preview = null;
    this.croppedImage = null;
  }

  onreload() {
    window.location.reload()
  }
}
