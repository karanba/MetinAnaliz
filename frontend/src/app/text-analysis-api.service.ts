import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyzeRequest, AnalyzeResponse, ExportFormat, ExportRequest } from './models';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class TextAnalysisApiService {
  constructor(private readonly http: HttpClient) {}

  analyze(text: string): Observable<AnalyzeResponse> {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const url = `${base}/analyze`;
    const payload: AnalyzeRequest = { text };
    return this.http.post<AnalyzeResponse>(url, payload);
  }

  export(text: string, format: ExportFormat): Observable<Blob> {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const url = `${base}/export`;
    const payload: ExportRequest = { text, format };
    return this.http.post(url, payload, { responseType: 'blob' });
  }
}
