import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { ImageUploadService } from '../../service/image-upload.service';
import { map } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { CommentService } from '../../service/comment.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, FormsModule],
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
  selectedImageName: string | null = null; // New property for image name
  croppedImage: SafeUrl | null = null;
  editing = false;
  isDragOver = false;
  rotation = 0;
  currentFilter: string = 'none'; // Initialize filter to 'none'
  selectedImageId: number | null = null;
  currentUserId: number | null = null;

  private baseUrl: string = '';

  imageInfos$!: Observable<any[]>;
  comments: any[] = [];
  newComment: string = '';

  constructor(
    private uploadService: ImageUploadService,
    private commentService: CommentService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.refreshImageList();
    this.loadComments();
    this.currentUserId = Number(sessionStorage.getItem('currentUserId'));
    if (isNaN(this.currentUserId)) {
      console.error('User ID not found or invalid.');
      this.currentUserId = null;
    }
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
    console.log('Delete button clicked for ID:', id);
    this.uploadService.deleteImage(id).subscribe({
      next: (response) => {
        console.log('Delete response:', response);
        if (response.status === 'success') {
          this.refreshImageList();
        } else {
          this.message = response.message || 'Could not delete the image!';
        }
      },
      error: (err) => {
        console.error('Error deleting image:', err);
        this.message = 'An error occurred while deleting the image.';
      }
    });
  }


  openPreview(imgUrl: string, imgName: string, imgId: number): void {
    console.log('Opening preview with:');
  console.log('Image URL:', imgUrl);   // Log the image URL
  console.log('Image Name:', imgName); // Log the image name
  console.log('Image ID:', imgId);     // Log the image ID

  if (!imgUrl || !imgName || !imgId) {
    console.error('Invalid parameters passed to openPreview:', imgUrl, imgName, imgId);
    return;
  }

  this.selectedImage = imgUrl;        // Set the image URL for the preview
  this.selectedImageName = imgName;   // Set the image name for the preview
  this.selectedImageId = imgId;       // Set the image ID for the preview
  this.rotation = 0;                  // Reset rotation when opening preview
  this.currentFilter = 'none';        // Reset filter when opening preview

  this.showModal('previewModal');     // Show the modal

  this.loadComments();                // Load comments for the selected image
  }
  
  
  closePreview(): void {
    this.selectedImage = null;
    this.selectedImageName = null; // Reset the image name
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
  

  // THIS ONE IS FETCHING THE COMMENTS
  loadComments(): void {
    if (this.selectedImageId !== null) { // Ensure this is a number
      this.commentService.getComments(this.selectedImageId).subscribe({
        next: (response) => {
          if (response.status.remarks === 'success') {
            this.comments = response.payload || [];
          } else {
            console.error('Failed to load comments:', response.status.message);
          }
        },
        error: (err) => console.error('Error fetching comments:', err)
      });
    }
  }
  
  
  // Method to add comment
  addComment(): void {
    if (this.selectedImageId !== null && this.currentUserId !== null) { // Ensure image and user IDs are present
      if (this.newComment.trim()) {
        const commentData = {
          id: this.selectedImageId,      // Image ID
          comment: this.newComment,      // Comment text
          user_id: Number(this.currentUserId)   // User ID, converted to a number
        };
  
        this.commentService.postComment(commentData).subscribe({
          next: (response) => {
            if (response.status.remarks === 'success') {
              this.newComment = '';
              this.loadComments(); // Reload comments after adding
            } else {
              console.error('Failed to post comment:', response.status.message);
            }
          },
          error: (err) => console.error('Error posting comment:', err)
        });
      } else {
        console.error('Comment is empty.');
      }
    } else {
      console.error('No image selected or user not logged in.');
    }
  }  
}  