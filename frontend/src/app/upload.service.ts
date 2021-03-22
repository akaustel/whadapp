import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface UploadFile {
  /** Hash of file */
  hash?: string;
  /** File name */
  name: string;
  /** Mime type given by browser */
  type: string;
  /** File size */
  size: number;
  /** Progress of upload in percent */
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  port = '' + (parseInt(window.location.port, 10) - 4200 + 8080);
  url = 'http://' + window.location.hostname + ':' + this.port + '/upload';

  constructor(
    private httpClient: HttpClient,
  ) { }

  public uploadHttp(file) {
    const formData = new FormData();
    formData.append('file', file);
    file.inProgress = true;

    return this.httpClient.post<any>(this.url, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(map((event) => {
      switch (event.type) {
        case HttpEventType.UploadProgress: {
          const progress = Math.round(100 * event.loaded / event.total);
          return { status: 'progress', message: progress };
        }
        case HttpEventType.Response: {
          return { status: 'complete', message: event.body };
        }
        default: {
          return { message: `Unhandled event: ${event.type}` };
        }
      }
    }));
  }
}
