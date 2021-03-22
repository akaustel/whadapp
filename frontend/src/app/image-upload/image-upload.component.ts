import { Component, OnInit, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { ReasonService } from '../reason.service';
import { UploadService, UploadFile } from '../upload.service';
import { btoh } from '../util';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent implements OnInit {
  @Input() file: string;
  @Output() fileChange = new EventEmitter<string>();

  uploadInProgress = false;
  files: UploadFile[] = [];

  private activeUploads = 0;

  constructor(
    public reason: ReasonService,
    private upload: UploadService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
  }

  onFileDropped(files) {
    this.uploadInProgress = true;

    Object.values(files).forEach((file: any) => {
      const index = this.files.length;

      this.files.push({ name: file.name, size: file.size, type: file.type, progress: 0 });
      this.activeUploads++;

      this.upload.uploadHttp(file).subscribe({
        next: (event) => {
          if (event.status === 'progress') {
            this.files[index].progress = event.message;

            if (event.message === 100) {
              if (--this.activeUploads === 0) {
                // all files uploaded
                this.uploadInProgress = false;
              }
            }
            return;
          }

          if (event.status === 'complete') {
            this.files[index].hash = event.message.hash;
            this.fileChange.emit(event.message.hash);
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  isImageType(type: string) {
    if (typeof type !== 'string') {
      return false;
    }

    return type.startsWith('image/');
  }
}
