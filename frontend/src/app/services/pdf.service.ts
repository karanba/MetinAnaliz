import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, Subject, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * PDF doğrulama sonucu
 */
export interface PDFValidationResult {
  is_valid: boolean;
  file_name: string;
  file_size: number;
  page_count: number | null;
  error: string | null;
}

/**
 * PDF dönüştürme sonucu
 */
export interface PDFConversionResult {
  success: boolean;
  file_id: string;
  original_name: string;
  output_name: string | null;
  error: string | null;
}

/**
 * PDF yapılandırma bilgisi
 */
export interface PDFConfig {
  max_file_size_mb: number;
  max_file_size_bytes: number;
  allowed_types: string[];
  allowed_extensions: string[];
}

/**
 * Wizard adım durumu
 */
export type WizardStepStatus = 'pending' | 'active' | 'completed' | 'error';

/**
 * Wizard adımı
 */
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: WizardStepStatus;
}

/**
 * PDF İşlem Tipi
 */
export type PDFOperation = 'convert-to-word' | 'merge' | 'split' | 'view';

@Injectable({
  providedIn: 'root'
})
export class PDFService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/pdf`;

  // State signals
  private readonly _selectedFile = signal<File | null>(null);
  private readonly _validationResult = signal<PDFValidationResult | null>(null);
  private readonly _conversionResult = signal<PDFConversionResult | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _uploadProgress = signal<number>(0);
  private readonly _config = signal<PDFConfig | null>(null);
  private readonly _currentStep = signal<number>(0);
  private readonly _userConsent = signal<boolean>(false);
  private readonly _currentOperation = signal<PDFOperation>('convert-to-word');

  // Wizard steps for convert-to-word
  private readonly _wizardSteps = signal<WizardStep[]>([
    {
      id: 'select',
      title: 'Dosya Seçimi',
      description: 'PDF dosyanızı seçin veya sürükleyip bırakın',
      icon: 'pi-upload',
      status: 'active'
    },
    {
      id: 'validate',
      title: 'Doğrulama',
      description: 'Dosya güvenlik ve format kontrolü',
      icon: 'pi-shield',
      status: 'pending'
    },
    {
      id: 'options',
      title: 'Seçenekler',
      description: 'Dönüştürme ayarlarını belirleyin',
      icon: 'pi-cog',
      status: 'pending'
    },
    {
      id: 'consent',
      title: 'Onay',
      description: 'Kullanım koşullarını kabul edin',
      icon: 'pi-check-circle',
      status: 'pending'
    },
    {
      id: 'convert',
      title: 'Dönüştür',
      description: 'İşlem tamamlandığında indirin',
      icon: 'pi-download',
      status: 'pending'
    }
  ]);

  // Public readonly signals
  readonly selectedFile = this._selectedFile.asReadonly();
  readonly validationResult = this._validationResult.asReadonly();
  readonly conversionResult = this._conversionResult.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly uploadProgress = this._uploadProgress.asReadonly();
  readonly config = this._config.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly userConsent = this._userConsent.asReadonly();
  readonly currentOperation = this._currentOperation.asReadonly();
  readonly wizardSteps = this._wizardSteps.asReadonly();

  // Computed
  readonly isFileSelected = computed(() => this._selectedFile() !== null);
  readonly isValidated = computed(() => this._validationResult()?.is_valid === true);
  readonly canProceed = computed(() => {
    const step = this._currentStep();
    switch (step) {
      case 0: return this.isFileSelected();
      case 1: return this.isValidated();
      case 2: return true; // Options always valid
      case 3: return this._userConsent();
      case 4: return this._conversionResult()?.success === true;
      default: return false;
    }
  });

  readonly maxFileSizeMB = computed(() => this._config()?.max_file_size_mb ?? 50);

  constructor() {
    this.loadConfig();
  }

  /**
   * Yapılandırma bilgilerini yükle
   */
  loadConfig(): void {
    this.http.get<PDFConfig>(`${this.apiUrl}/config`)
      .pipe(
        catchError(err => {
          console.error('PDF config load error:', err);
          // Default config
          return [{
            max_file_size_mb: 50,
            max_file_size_bytes: 50 * 1024 * 1024,
            allowed_types: ['application/pdf'],
            allowed_extensions: ['.pdf']
          }];
        })
      )
      .subscribe(config => this._config.set(config));
  }

  /**
   * Dosya seç
   */
  selectFile(file: File): void {
    this._selectedFile.set(file);
    this._validationResult.set(null);
    this._conversionResult.set(null);
    this._error.set(null);
    this._uploadProgress.set(0);
  }

  /**
   * Dosyayı temizle
   */
  clearFile(): void {
    this._selectedFile.set(null);
    this._validationResult.set(null);
    this._conversionResult.set(null);
    this._error.set(null);
    this._uploadProgress.set(0);
  }

  /**
   * PDF dosyasını doğrula
   */
  validateFile(): Observable<PDFValidationResult> {
    const file = this._selectedFile();
    if (!file) {
      return throwError(() => new Error('Dosya seçilmedi'));
    }

    this._loading.set(true);
    this._error.set(null);

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<PDFValidationResult>(`${this.apiUrl}/validate`, formData)
      .pipe(
        tap(result => {
          this._validationResult.set(result);
          this._loading.set(false);
          if (!result.is_valid) {
            this._error.set(result.error);
          }
        }),
        catchError(err => {
          this._loading.set(false);
          this._error.set(err.error?.detail || err.message || 'Doğrulama hatası');
          return throwError(() => err);
        })
      );
  }

  /**
   * PDF'i Word'e dönüştür
   */
  convertToWord(startPage: number = 0, endPage?: number): Observable<PDFConversionResult> {
    const file = this._selectedFile();
    if (!file) {
      return throwError(() => new Error('Dosya seçilmedi'));
    }

    this._loading.set(true);
    this._error.set(null);
    this._uploadProgress.set(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('start_page', startPage.toString());
    if (endPage !== undefined) {
      formData.append('end_page', endPage.toString());
    }

    return this.http.post<PDFConversionResult>(`${this.apiUrl}/convert-to-word`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this._uploadProgress.set(Math.round(100 * event.loaded / event.total));
          return null as any;
        } else if (event.type === HttpEventType.Response) {
          return event.body as PDFConversionResult;
        }
        return null as any;
      }),
      tap(result => {
        if (result) {
          this._conversionResult.set(result);
          this._loading.set(false);
          if (!result.success) {
            this._error.set(result.error);
          }
        }
      }),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.error?.detail || err.message || 'Dönüştürme hatası');
        return throwError(() => err);
      })
    );
  }

  /**
   * Dönüştürülmüş dosyayı indir
   */
  downloadFile(fileId: string, fileName: string): void {
    this.http.get(`${this.apiUrl}/download/${fileId}`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this._error.set('İndirme hatası: ' + (err.message || 'Bilinmeyen hata'));
      }
    });
  }

  /**
   * Wizard adımını değiştir
   */
  setStep(step: number): void {
    if (step >= 0 && step < this._wizardSteps().length) {
      this._currentStep.set(step);
      this.updateStepStatuses(step);
    }
  }

  /**
   * Sonraki adıma geç
   */
  nextStep(): void {
    const current = this._currentStep();
    if (current < this._wizardSteps().length - 1) {
      this.setStep(current + 1);
    }
  }

  /**
   * Önceki adıma geç
   */
  prevStep(): void {
    const current = this._currentStep();
    if (current > 0) {
      this.setStep(current - 1);
    }
  }

  /**
   * Adım durumlarını güncelle
   */
  private updateStepStatuses(currentStep: number): void {
    const steps = this._wizardSteps();
    const updatedSteps = steps.map((step, index) => ({
      ...step,
      status: index < currentStep ? 'completed' :
              index === currentStep ? 'active' : 'pending'
    })) as WizardStep[];
    this._wizardSteps.set(updatedSteps);
  }

  /**
   * Kullanıcı onayını ayarla
   */
  setUserConsent(consent: boolean): void {
    this._userConsent.set(consent);
  }

  /**
   * İşlem tipini ayarla
   */
  setOperation(operation: PDFOperation): void {
    this._currentOperation.set(operation);
  }

  /**
   * Tüm state'i sıfırla
   */
  reset(): void {
    this._selectedFile.set(null);
    this._validationResult.set(null);
    this._conversionResult.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._uploadProgress.set(0);
    this._currentStep.set(0);
    this._userConsent.set(false);
    this.updateStepStatuses(0);
  }

  /**
   * Client-side dosya boyutu kontrolü
   */
  isFileSizeValid(file: File): boolean {
    const maxBytes = this._config()?.max_file_size_bytes ?? (50 * 1024 * 1024);
    return file.size <= maxBytes;
  }

  /**
   * Client-side dosya tipi kontrolü
   */
  isFileTypeValid(file: File): boolean {
    const allowedTypes = this._config()?.allowed_types ?? ['application/pdf'];
    return allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Dosya boyutunu formatla
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
