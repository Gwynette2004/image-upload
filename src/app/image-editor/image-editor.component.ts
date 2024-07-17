import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { ImageUploadService } from '../service/image-upload.service';
import ImageEditor from 'tui-image-editor';
import 'tui-image-editor';
import 'tui-code-snippet';

@Component({
  selector: 'app-image-editor',
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.css']
})
export class ImageEditorComponent implements OnInit {
  @Input() image!: string;  
  private editor!: ImageEditor;

  @ViewChild('tuiImageEditor', { static: true }) tuiImageEditor!: ElementRef;

  constructor(private uploadService: ImageUploadService) {}

  ngOnInit(): void {
    this.editor = new ImageEditor(this.tuiImageEditor.nativeElement, {
      includeUI: {
        loadImage: {
          path: this.image,
          name: 'UploadedImage',
        },
        menu: ['crop', 'flip', 'rotate', 'draw', 'text', 'shape', 'colorPicker'],
        initMenu: 'crop',
        uiSize: {
          width: '700px',
          height: '500px',
        },
      },
      cssMaxWidth: 700,
      cssMaxHeight: 500,
    });
  }

  getEditedImage(): string {
    return this.editor.toDataURL();
  }

  uploadEditedImage() {
    const editedImage = this.getEditedImage();
    const blob = this.dataURLtoBlob(editedImage); // Convert to Blob

    // Convert Blob to File
    const file = new File([blob], 'edited-image.png', { type: blob.type });

    this.uploadService.upload(file).subscribe({
      next: (response) => {
        console.log('Image uploaded successfully', response);
      },
      error: (err) => {
        console.error('Upload failed', err);
      }
    });
  }

  dataURLtoBlob(dataURL: string): Blob {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }
}
