export interface AnalyzeRequest {
  text: string;
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
  syllable_distribution: {
    3: number;
    4: number;
    5: number;
    6: number;
  };
  yod_value: number;
}

export interface AnalyzeResponse {
  sentences: SentenceInfo[];
  statistics: Statistics;
}
