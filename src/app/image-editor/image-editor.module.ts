import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageEditorComponent } from './image-editor.component'; // Adjust the path as necessary

@NgModule({
  declarations: [ImageEditorComponent],
  imports: [CommonModule],
  exports: [ImageEditorComponent] // Export the component
})
export class ImageEditorModule {}