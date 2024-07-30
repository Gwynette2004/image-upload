import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';
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
  @ViewChild('editImage') editImage!: ElementRef<HTMLImageElement>;

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
  showUploadSection = false; // Property to toggle upload section visibility
  showEditSection = false;
  isDropdownOpen = false;



  private baseUrl: string = '';

  imageInfos$!: Observable<any[]>;
  comments: any[] = [];
  newComment: string = '';

  constructor(
    private uploadService: ImageUploadService,
    private commentService: CommentService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshImageList();
    this.currentUserId = Number(sessionStorage.getItem('currentUserId'));
    if (isNaN(this.currentUserId)) {
      console.error('User ID not found or invalid.');
      this.currentUserId = null;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // Any updates to variables affecting the view
      this.cdr.detectChanges(); // Manually trigger change detection
    }, 0);
  }

  ngOnDestroy(): void {}

  files: { file: File, preview: string }[] = [];
  
  
  selectFiles(event: Event): void {
    this.message = '';
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const selectedFiles = Array.from(input.files);
      this.files = selectedFiles.map(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.files = this.files.map(f => f.file === file ? { file, preview: e.target.result } : f);
          // Ensure the preview is updated for the selected file
          if (this.files.length > 0) {
            this.preview = this.files[0].preview; // Set preview for the first file as an example
          }
        };
        reader.readAsDataURL(file);
        return { file, preview: '' }; // Initialize with empty preview
      });
    }
  }
  
  

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
    console.log('Drag Over');
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    console.log('Drag Leave');
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files = event.dataTransfer.files;
      this.currentFile = files[0];
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.preview = e.target.result; // Set the preview
        this.editing = false;
        this.rotation = 0; // Reset rotation when a new file is dropped
      };
      reader.readAsDataURL(this.currentFile);
      
      // Optionally process all files, not just the first one
      this.files = Array.from(files).map(file => ({
        file,
        preview: ''
      }));
      
      this.files.forEach(fileObj => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.files = this.files.map(f => f.file === fileObj.file ? { file: fileObj.file, preview: e.target.result } : f);
        };
        reader.readAsDataURL(fileObj.file);
      });
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
  
    // Clear the files array
    this.files = [];
    
    // Close any open modals
    this.closeModal('previewModal');
    this.closeModal('cropperModal'); // Ensure this modal is also closed
  }

  upload(): void {
    if (this.files.length > 0) {
      const formData = new FormData();
      this.files.forEach(fileObj => formData.append('image[]', fileObj.file));
      this.resetUploadState();
  
      this.uploadService.upload(formData).subscribe({
        next: (event: any) => {
          if (event instanceof HttpResponse) {
            this.message = event.body.message;
            this.refreshImageList();
            this.resetUploadState();
            this.files = [];
          }
        },
        error: (err) => {
          this.message = 'Upload failed: ' + err.message;
        },
        complete: () => {
          this.resetUploadState();
          this.closeModal('uploadModal');
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
        this.refreshImageList();
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

    setTimeout(() => {
      const uploadedImageElement = this.uploadedImage?.nativeElement;
      if (uploadedImageElement) {
        console.log('Preview image element:', uploadedImageElement);
        this.cdr.detectChanges();
      } else {
        console.error('Uploaded image element not found in preview modal.');
      }
    }, 500);
  
    this.loadComments();
  }

  
  closePreview(): void {
    this.selectedImage = null;
    this.selectedImageName = null; // Reset the image name
    this.closeModal('previewModal');
  }

rotatePreviewImage(): void {
  this.rotation += 90;
  console.log('Rotating image by:', this.rotation, 'degrees');
  if (this.editImage) {
    console.log('Image element found:', this.editImage.nativeElement);
    this.editImage.nativeElement.style.transform = `rotate(${this.rotation}deg)`;
  } else {
    console.error('Edit image element not found.');
  }
}

  resetPreviewImage(): void {
    console.log('Resetting preview image');
    this.rotation = 0;
    const previewImage = document.querySelector('.preview-image') as HTMLImageElement;
    if (previewImage) {
      previewImage.style.transform = `rotate(${this.rotation}deg)`;
    }
  }

  shareImage(event:Event): void {
    event.stopPropagation()
    console.log('Edit button clicked');
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
    console.log('Applying filter:', filter); // Log the filter being applied
    if (this.uploadedImage) {
        this.uploadedImage.nativeElement.style.filter = filter;
    } else {
        console.error('Uploaded image element not found for applying filter.');
    }
}
applyChanges(): void {
  if (this.selectedImageId !== null) {
    const filterData = {
      imageId: this.selectedImageId,
      filter: this.currentFilter,
      rotation: this.rotation // Include rotation if applicable
    };

    console.log('Applying changes with filter data:', filterData);

    this.uploadService.updateImage(filterData).subscribe({
      next: (response) => {
        console.log('Server response:', response);
        if (response.status.remarks === 'success') {
          this.message = 'Filter applied successfully.';
          
          // Set the URL fragment with the selected image ID
          window.location.hash = `modal-${this.selectedImageId}`;
          
          // Reload the page
          window.location.reload();
        } else {
          this.message = response.status.message || 'Failed to apply filter.';
        }
      },
      error: (err) => {
        console.error('Error applying filter:', err);
        this.message = 'An error occurred while applying the filter.';
      }
    });
  } else {
    this.message = 'No image selected or invalid image ID.';
  }
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
    window.location.reload();
  }
  
  // Fetch updated image after update
  private fetchUpdatedImage(): void {
    if (this.selectedImageId !== null) {
      this.uploadService.getFiles().subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.refreshImageList(); // Refresh image list to show updated image
          }
        },
        error: (err) => console.error('Error fetching updated image:', err)
      });
    }
  }

  // THIS ONE IS FETCHING THE COMMENTS
  loadComments(): void {
    if (this.selectedImageId !== null) { // Ensure this is a number
      this.commentService.getComments(this.selectedImageId).subscribe({
        next: (response) => {
          if (response.status.remarks === 'success') {
            this.comments = response.payload || [];
            this.cdr.detectChanges(); // Manually trigger change detection
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

  toggleUploadSection(): void {
    this.showUploadSection = !this.showUploadSection;
  }

  openEditModal(event:Event) {
    console.log('Edit button clicked');
    document.getElementById('editModal')!.style.display = 'block';
    event.stopPropagation();
  }
  
  closeEditModal() {
    document.getElementById('editModal')!.style.display = 'none';
  }
  
  downloadImage(event:Event): void {
    event.stopPropagation()
    console.log('Edit button clicked');
    if (this.selectedImage) {
      console.log('Downloading image:', this.selectedImage);
  
      fetch(this.selectedImage, { mode: 'no-cors' })
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.selectedImageName || 'downloaded_image';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url); // Clean up the URL object
        })
        .catch(error => {
          console.error('Error downloading the image:', error);
          this.message = 'An error occurred while downloading the image.';
        });
    } else {
      this.message = 'No image selected for download.';
    }
  }


  logout() {
    localStorage.removeItem('authToken'); 
    this.router.navigate(['/login']);
  }

  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }


}
