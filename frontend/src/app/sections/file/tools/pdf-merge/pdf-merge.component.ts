import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnDestroy,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PageHeaderComponent } from '../../../../components/shared';
import { PDFService } from '../../../../services/pdf.service';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Steps } from 'primeng/steps';
import { FileUpload } from 'primeng/fileupload';
import { ProgressBar } from 'primeng/progressbar';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-pdf-merge',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    PageHeaderComponent,
    Button,
    Card,
    Steps,
    FileUpload,
    ProgressBar,
    ProgressSpinner,
    Checkbox,
    InputText,
    Tag,
    Message,
    Tooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pdf-merge.component.html',
  styleUrls: ['./pdf-merge.component.scss'],
})
export class PDFMergeComponent implements OnDestroy {
  readonly pdfService = inject(PDFService);

  // Local state
  isDragOver = signal(false);
  outputFileName = signal('merged.pdf');
  currentStep = signal(0);
  userConsent = signal(false);

  // Steps for PrimeNG Steps component
  steps: MenuItem[] = [
    { label: 'Dosyalar' },
    { label: 'Doğrulama' },
    { label: 'Sıralama' },
    { label: 'Onay' },
    { label: 'İndir' }
  ];

  // Computed
  readonly selectedFiles = this.pdfService.selectedFiles;
  readonly validationResults = this.pdfService.validationResults;
  readonly mergeResult = this.pdfService.mergeResult;
  readonly loading = this.pdfService.loading;
  readonly error = this.pdfService.error;
  readonly uploadProgress = this.pdfService.uploadProgress;
  readonly maxFileSizeMB = this.pdfService.maxFileSizeMB;
  readonly maxFilesPerRequest = this.pdfService.maxFilesPerRequest;
  readonly canAddMoreFiles = this.pdfService.canAddMoreFiles;
  readonly allFilesValidated = this.pdfService.allFilesValidated;

  readonly totalFileSize = computed(() => {
    return this.selectedFiles().reduce((sum, file) => sum + file.size, 0);
  });

  readonly totalFileSizeFormatted = computed(() => {
    return this.pdfService.formatFileSize(this.totalFileSize());
  });

  readonly totalPages = computed(() => {
    return this.validationResults().reduce((sum, r) => sum + (r.page_count ?? 0), 0);
  });

  ngOnDestroy(): void {
    this.pdfService.clearMergeFiles();
  }

  // Drag and drop handlers for drop zone
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (!this.pdfService.addFileForMerge(files[i])) {
          break; // Stop if we hit the limit
        }
      }
    }
  }

  // File selection
  onFileSelect(event: any): void {
    const files = event.files || event.currentFiles;
    if (files) {
      for (const file of files) {
        if (!this.pdfService.addFileForMerge(file)) {
          break;
        }
      }
    }
  }

  // Remove file
  removeFile(index: number): void {
    this.pdfService.removeFileFromMerge(index);
  }

  // Reorder files (CDK drag drop)
  onFileDrop(event: CdkDragDrop<File[]>): void {
    this.pdfService.reorderFilesForMerge(event.previousIndex, event.currentIndex);
  }

  // Navigation
  nextStep(): void {
    const step = this.currentStep();

    switch (step) {
      case 0: // Files -> Validation
        if (this.selectedFiles().length >= 2) {
          this.currentStep.set(1);
          this.validateFiles();
        }
        break;

      case 1: // Validation -> Reorder
        if (this.allFilesValidated()) {
          this.currentStep.set(2);
        }
        break;

      case 2: // Reorder -> Consent
        this.currentStep.set(3);
        break;

      case 3: // Consent -> Merge
        if (this.userConsent()) {
          this.currentStep.set(4);
          this.startMerge();
        }
        break;
    }
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step > 0) {
      this.currentStep.set(step - 1);
    }
  }

  // Validation
  validateFiles(): void {
    this.pdfService.validateFilesForMerge().subscribe({
      error: () => {
        // Error is handled in service
      }
    });
  }

  // Merge
  startMerge(): void {
    const outputName = this.outputFileName() || 'merged.pdf';
    this.pdfService.mergePDFs(outputName).subscribe({
      error: () => {
        // Error is handled in service
      }
    });
  }

  // Download
  downloadResult(): void {
    const result = this.mergeResult();
    if (result?.success && result.file_id && result.output_name) {
      this.pdfService.downloadFile(result.file_id, result.output_name);
    }
  }

  // Consent
  onConsentChange(value: boolean): void {
    this.userConsent.set(value);
  }

  // Reset
  startOver(): void {
    this.pdfService.clearMergeFiles();
    this.currentStep.set(0);
    this.userConsent.set(false);
    this.outputFileName.set('merged.pdf');
  }

  // Format file size
  formatFileSize(bytes: number): string {
    return this.pdfService.formatFileSize(bytes);
  }
}
