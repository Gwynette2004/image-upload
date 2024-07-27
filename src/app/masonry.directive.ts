import { Directive, ElementRef, Renderer2, AfterViewInit, Input } from '@angular/core';

@Directive({
  selector: '[appMasonry]' // This is how you'll apply the directive in your HTML
})
export class MasonryDirective implements AfterViewInit {
  @Input() columnCount: number = 3;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.layoutMasonry();
  }

  private layoutMasonry() {
    const container = this.el.nativeElement as HTMLElement;
    const items = Array.from(container.children) as HTMLElement[];

    // Reset the positions of items
    items.forEach(item => {
      this.renderer.setStyle(item, 'margin-bottom', '15px');
    });

    // Layout the items
    let columnHeights = [0, 0]; // Assuming 2 columns for simplicity

    items.forEach((item: HTMLElement, index: number) => {
      const columnIndex = index % 2;
      const itemHeight = item.offsetHeight;

      if (columnHeights[columnIndex] <= columnHeights[(columnIndex + 1) % 2]) {
        this.renderer.setStyle(item, 'position', 'absolute');
        this.renderer.setStyle(item, 'top', `${columnHeights[columnIndex]}px`);
        this.renderer.setStyle(item, 'left', `${columnIndex * (container.offsetWidth / 2)}px`);
        columnHeights[columnIndex] += itemHeight + 15; // Update height including gap
      } else {
        this.renderer.setStyle(item, 'position', 'absolute');
        this.renderer.setStyle(item, 'top', `${columnHeights[(columnIndex + 1) % 2]}px`);
        this.renderer.setStyle(item, 'left', `${(columnIndex + 1) * (container.offsetWidth / 2)}px`);
        columnHeights[(columnIndex + 1) % 2] += itemHeight + 15;
      }
    });

    container.style.position = 'relative';
    container.style.height = `${Math.max(...columnHeights)}px`;
  }
}
