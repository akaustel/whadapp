import { Directive, HostBinding, Output, HostListener, EventEmitter } from '@angular/core';

@Directive({
    selector: '[appDragFile]'
})
export class DragFileDirective {
    @HostBinding('class.fileover') fileOver: boolean;
    @Output() fileDropped = new EventEmitter<any>();

    // Dragover listener
    @HostListener('dragover', ['$event'])
    onDragOver(event) {
        event.preventDefault();
        event.stopPropagation();

        this.fileOver = true;
    }

    // Dragleave listener
    @HostListener('dragleave', ['$event'])
    public onDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();

        this.fileOver = false;
    }

    // Drop listener
    @HostListener('drop', ['$event'])
    public ondrop(event) {
        event.preventDefault();
        event.stopPropagation();

        this.fileOver = false;

        const files = event.dataTransfer.files;

        if (files.length > 0) {
            this.fileDropped.emit(files);
        }
    }

}
