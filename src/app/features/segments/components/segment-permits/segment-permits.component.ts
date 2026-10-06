import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { SegmentService } from '../../segment.service';

@Component({
  selector: 'app-segment-permits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segment-permits.component.html',
  styleUrls: ['./segment-permits.component.css']
})
export class SegmentPermitsComponent implements OnInit {
  @Input() segmentId!: number;
  
  permits: any[] = [];
  loading = false;
  uploading = false;
  uploadProgress = 0;
  error: string | null = null;

  constructor(private segmentService: SegmentService) {}

  ngOnInit() {
    this.loadPermits();
  }

  loadPermits() {
    if (!this.segmentId) return;
    this.loading = true;
    this.segmentService.getPermits(this.segmentId).subscribe({
      next: (data) => {
        this.permits = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load permits';
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Validar límite de 5 MB
      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        this.error = 'El archivo es demasiado grande. El límite máximo es de 5 MB.';
        return;
      }
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    this.uploading = true;
    this.uploadProgress = 0;
    this.error = null;
    this.segmentService.uploadPermit(this.segmentId, file).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
          }
        } else if (event.type === HttpEventType.Response) {
          this.permits.push(event.body);
          this.uploading = false;
          this.uploadProgress = 0;
        }
      },
      error: (err) => {
        this.error = 'Failed to upload permit';
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }
}
