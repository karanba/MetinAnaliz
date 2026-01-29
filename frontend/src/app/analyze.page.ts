import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { timeout } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { TextAnalysisApiService } from "./text-analysis-api.service";
import { AnalyzeResponse } from "./models";
import { ResultsPanelComponent } from "./results-panel.component";
import { SentenceListComponent } from "./sentence-list.component";

@Component({
  selector: "app-analyze-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ResultsPanelComponent,
    SentenceListComponent,
  ],
  templateUrl: "./analyze.page.html",
  styleUrls: ["./analyze.page.scss"],
})
export class AnalyzePageComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  text = "";
  loading = false;
  errorMessage = "";
  result: AnalyzeResponse | null = null;

  constructor(private readonly api: TextAnalysisApiService) {}

  async analyze(): Promise<void> {
    this.errorMessage = "";
    this.result = null;
    this.loading = true;

    try {
      const response = await firstValueFrom(
        this.api.analyze(this.text).pipe(timeout(30000)),
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

  copyJson(): void {
    if (!this.result) {
      return;
    }
    const payload = JSON.stringify(this.result, null, 2);
    navigator.clipboard.writeText(payload).catch(() => {
      this.errorMessage = "JSON kopyalanamadı.";
    });
  }
}
