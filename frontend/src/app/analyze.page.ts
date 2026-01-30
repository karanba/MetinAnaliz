import { ChangeDetectorRef, Component, inject, AfterViewChecked } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { timeout } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { TextAnalysisApiService } from "./text-analysis-api.service";
import { AnalyzeResponse, ExportFormat } from "./models";
import { ResultsPanelComponent } from "./results-panel.component";
import { SentenceListComponent } from "./sentence-list.component";
import { Button } from "primeng/button";
import { Card } from "primeng/card";
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { ProgressSpinner } from "primeng/progressspinner";
import { Skeleton } from "primeng/skeleton";
import { Tag } from "primeng/tag";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";
import { Dialog } from "primeng/dialog";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "app-analyze-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ResultsPanelComponent,
    SentenceListComponent,
    Button,
    Card,
    Select,
    Textarea,
    ProgressSpinner,
    Skeleton,
    Tag,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Dialog,
    Tooltip,
  ],
  templateUrl: "./analyze.page.html",
  styleUrls: ["./analyze.page.scss"],
})
export class AnalyzePageComponent implements AfterViewChecked {
  private readonly cdr = inject(ChangeDetectorRef);
  text = "";
  loading = false;
  errorMessage = "";
  result: AnalyzeResponse | null = null;
  exportFormat: ExportFormat = "csv";
  exportFormats = [
    { label: "CSV", value: "csv" },
    { label: "TXT", value: "txt" },
    { label: "PDF", value: "pdf" },
  ];
  exporting = false;

  // Analysis options
  optionsDialogVisible = false;
  analysisType: 'yod' | 'atesman' | 'cetinkaya' = 'yod';
  selectedAnalysisType: 'yod' | 'atesman' | 'cetinkaya' = 'yod';

  // AdSense tracking
  private adPushed = false;

  constructor(private readonly api: TextAnalysisApiService) {}

  ngAfterViewChecked(): void {
    // Initialize AdSense when empty state is shown
    if (!this.result && !this.loading && !this.adPushed) {
      this.loadAd();
    } else if ((this.result || this.loading) && this.adPushed) {
      // Reset flag when conditions change
      this.adPushed = false;
    }
  }

  private loadAd(): void {
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
      this.adPushed = true;
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }

  async analyze(): Promise<void> {
    this.errorMessage = "";
    this.result = null;
    this.loading = true;

    try {
      const response = await firstValueFrom(
        this.api.analyze(this.text, this.analysisType).pipe(timeout(30000)),
      );
      this.result = response;
      this.cdr.detectChanges();
    } catch (err: any) {
      this.errorMessage =
        err?.error?.detail || "Analiz sırasında bir hata oluştu.";
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  exportResult(): void {
    if (!this.result || this.exporting) {
      return;
    }
    this.exporting = true;
    this.errorMessage = "";
    this.api.export(this.text, this.exportFormat, this.analysisType).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `metin-analiz.${this.exportFormat}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        this.exporting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.detail || "Export sırasında bir hata oluştu.";
        this.exporting = false;
        this.cdr.detectChanges();
      },
    });
  }

  clearText(): void {
    this.text = "";
    this.result = null;
    this.errorMessage = "";
  }

  showOptionsDialog(): void {
    this.selectedAnalysisType = this.analysisType;
    this.optionsDialogVisible = true;
  }

  selectAnalysisType(type: 'yod' | 'atesman' | 'cetinkaya'): void {
    this.selectedAnalysisType = type;
  }

  applyOptions(): void {
    this.analysisType = this.selectedAnalysisType;
    this.optionsDialogVisible = false;
    // Re-analyze if there's existing text and results
    if (this.text.trim() && this.result) {
      this.analyze();
    }
  }

  getAnalysisTypeLabel(): string {
    switch (this.analysisType) {
      case 'yod':
        return 'YOD değerini';
      case 'atesman':
        return 'Ateşman skorunu';
      case 'cetinkaya':
        return 'Çetinkaya-Uzun skorunu';
      default:
        return 'okunabilirlik skorunu';
    }
  }
}
