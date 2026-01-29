export type AnalysisType = 'yod' | 'atesman' | 'cetinkaya';

export interface AnalyzeRequest {
  text: string;
  analysis_type?: AnalysisType;
}

export type ExportFormat = 'csv' | 'txt' | 'pdf';

export interface ExportRequest {
  text: string;
  format: ExportFormat;
  analysis_type?: AnalysisType;
}

export interface WordInfo {
  word: string;
  syllable_count: number;
}

export interface SentenceInfo {
  sentence_index: number;
  sentence_text: string;
  words: WordInfo[];
}

export interface Statistics {
  total_sentences: number;
  total_words: number;
  total_syllables: number;
  oks_value: number;
  syllable_distribution: {
    3: number;
    4: number;
    5: number;
    6: number;
  };
  yod_value: number; // Kept for backward compatibility
  readability_score: number;
  analysis_type: string;
}

export interface AnalyzeResponse {
  sentences: SentenceInfo[];
  statistics: Statistics;
}
