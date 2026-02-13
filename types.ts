
export interface ConversionProgress {
  currentPage: number;
  totalPages: number;
  status: 'idle' | 'reading' | 'processing' | 'completed' | 'error';
  message: string;
}

export interface ConversionResult {
  markdown: string;
  fileName: string;
}

export enum PreviewMode {
  MARKDOWN = 'MARKDOWN',
  RENDERED = 'RENDERED'
}
