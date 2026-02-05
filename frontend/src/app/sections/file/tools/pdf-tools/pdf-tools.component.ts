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
import { PageHeaderComponent } from '../../../../components/shared';
import { PDFService } from '../../../../services/pdf.service';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Steps } from 'primeng/steps';
import { FileUpload } from 'primeng/fileupload';
import { ProgressBar } from 'primeng/progressbar';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Checkbox } from 'primeng/checkbox';
import { InputNumber } from 'primeng/inputnumber';
import { Tag } from 'primeng/tag';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-pdf-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    Button,
    Card,
    Steps,
    FileUpload,
    ProgressBar,
    ProgressSpinner,
    Checkbox,
    InputNumber,
    Tag,
    Message,
    Tooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pdf-tools.component.html',
  styleUrls: ['./pdf-tools.component.scss'],
})
export class PDFToolsComponent implements OnDestroy {
  readonly pdfService = inject(PDFService);

  // Local state
  isDragOver = signal(false);
  startPage = signal(0);
  endPage = signal<number | null>(null);
  convertAllPages = signal(true);

  // Steps for PrimeNG Steps component
  steps: MenuItem[] = [
    { label: 'Dosya' },
    { label: 'Doğrulama' },
    { label: 'Seçenekler' },
    { label: 'Onay' },
    { label: 'İndir' }
  ];

  // Computed
  readonly currentStep = this.pdfService.currentStep;
  readonly selectedFile = this.pdfService.selectedFile;
  readonly validationResult = this.pdfService.validationResult;
  readonly conversionResult = this.pdfService.conversionResult;
  readonly loading = this.pdfService.loading;
  readonly error = this.pdfService.error;
  readonly uploadProgress = this.pdfService.uploadProgress;
  readonly userConsent = this.pdfService.userConsent;
  readonly maxFileSizeMB = this.pdfService.maxFileSizeMB;

  readonly fileSizeFormatted = computed(() => {
    const file = this.selectedFile();
    return file ? this.pdfService.formatFileSize(file.size) : '';
  });

  readonly pageCount = computed(() => {
    return this.validationResult()?.page_count ?? 0;
  });

  ngOnDestroy(): void {
    this.pdfService.reset();
  }

  // Drag and drop handlers
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
    if (files && files.length > 0) {
      this.handleFileSelect(files[0]);
    }
  }

  // File selection
  onFileSelect(event: any): void {
    const file = event.files?.[0] || event.currentFiles?.[0];
    if (file) {
      this.handleFileSelect(file);
    }
  }

  handleFileSelect(file: File): void {
    // Client-side validation
    if (!this.pdfService.isFileTypeValid(file)) {
      this.pdfService.reset();
      return;
    }

    if (!this.pdfService.isFileSizeValid(file)) {
      this.pdfService.reset();
      return;
    }

    this.pdfService.selectFile(file);
  }

  // Navigation
  nextStep(): void {
    const step = this.currentStep();

    switch (step) {
      case 0: // File selection -> Validation
        if (this.selectedFile()) {
          this.pdfService.nextStep();
          this.validateFile();
        }
        break;

      case 1: // Validation -> Options
        if (this.validationResult()?.is_valid) {
          this.pdfService.nextStep();
        }
        break;

      case 2: // Options -> Consent
        this.pdfService.nextStep();
        break;

      case 3: // Consent -> Convert
        if (this.userConsent()) {
          this.pdfService.nextStep();
          this.startConversion();
        }
        break;

      default:
        break;
    }
  }

  prevStep(): void {
    this.pdfService.prevStep();
  }

  // Validation
  validateFile(): void {
    this.pdfService.validateFile().subscribe({
      error: () => {
        // Error is handled in service
      }
    });
  }

  // Conversion
  startConversion(): void {
    const startPage = this.convertAllPages() ? 0 : this.startPage();
    const endPage = this.convertAllPages() ? undefined : (this.endPage() ?? undefined);

    this.pdfService.convertToWord(startPage, endPage).subscribe({
      error: () => {
        // Error is handled in service
      }
    });
  }

  // Download
  downloadResult(): void {
    const result = this.conversionResult();
    if (result?.success && result.file_id && result.output_name) {
      this.pdfService.downloadFile(result.file_id, result.output_name);
    }
  }

  // Consent
  onConsentChange(value: boolean): void {
    this.pdfService.setUserConsent(value);
  }

  // Reset
  startOver(): void {
    this.pdfService.reset();
    this.startPage.set(0);
    this.endPage.set(null);
    this.convertAllPages.set(true);
  }

  // Remove file
  removeFile(): void {
    this.pdfService.clearFile();
  }

  // Page range toggle
  onConvertAllPagesChange(): void {
    if (this.convertAllPages()) {
      this.startPage.set(0);
      this.endPage.set(null);
    }
  }
}
