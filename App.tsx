
import React, { useState, useEffect } from 'react';
import { FileText, Cpu, ChevronRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import FileUploader from './components/FileUploader';
import MarkdownPreview from './components/MarkdownPreview';
import { getPdfInfo, renderPageToImage } from './services/pdfService';
import { convertPageToMarkdown } from './services/geminiService';
import { ConversionProgress, ConversionResult } from './types';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ConversionProgress>({
    currentPage: 0,
    totalPages: 0,
    status: 'idle',
    message: ''
  });
  const [result, setResult] = useState<ConversionResult | null>(null);

  const startConversion = async () => {
    if (!file) return;

    try {
      setResult(null);
      setProgress({
        currentPage: 0,
        totalPages: 0,
        status: 'reading',
        message: 'Opening PDF file...'
      });

      const { pdf, numPages } = await getPdfInfo(file);
      
      setProgress(prev => ({
        ...prev,
        status: 'processing',
        totalPages: numPages,
        message: `Found ${numPages} pages. Starting conversion...`
      }));

      let fullMarkdown = '';

      for (let i = 1; i <= numPages; i++) {
        setProgress(prev => ({
          ...prev,
          currentPage: i,
          message: `Converting page ${i} of ${numPages}...`
        }));

        const base64Image = await renderPageToImage(pdf, i);
        const pageMarkdown = await convertPageToMarkdown(base64Image);
        
        fullMarkdown += pageMarkdown + '\n\n---\n\n';
        
        // Brief delay to prevent rate limits and allow UI updates
        await new Promise(r => setTimeout(r, 100));
      }

      setResult({
        markdown: fullMarkdown,
        fileName: file.name
      });
      
      setProgress(prev => ({
        ...prev,
        status: 'completed',
        message: 'Conversion completed successfully!'
      }));

    } catch (error: any) {
      console.error(error);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        message: error.message || 'An error occurred during conversion'
      }));
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setProgress({
      currentPage: 0,
      totalPages: 0,
      status: 'idle',
      message: ''
    });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">PDF to Markdown</h1>
              <p className="text-xs text-slate-500 font-medium">Precision AI Converter</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Gemini 3 Powered</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Convert Complex Documents to Clean Markdown
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our AI-first approach handles tables, multi-column text, and intricate layouts with maximum precision.
          </p>
        </div>

        {!result && (
          <div className="space-y-8">
            <FileUploader 
              onFileSelect={setFile} 
              selectedFile={file} 
              onClear={reset}
              isProcessing={progress.status === 'processing' || progress.status === 'reading'}
            />

            {file && progress.status === 'idle' && (
              <div className="flex justify-center">
                <button
                  onClick={startConversion}
                  className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
                >
                  Start Conversion
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            )}

            {progress.status !== 'idle' && (
              <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {progress.status === 'processing' || progress.status === 'reading' ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : progress.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                      </div>
                    )}
                    <span className="font-semibold text-slate-900">{progress.status.toUpperCase()}</span>
                  </div>
                  {progress.totalPages > 0 && (
                    <span className="text-sm font-medium text-slate-500">
                      Page {progress.currentPage} of {progress.totalPages}
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.totalPages > 0 ? (progress.currentPage / progress.totalPages) * 100 : 0}%` }}
                  />
                </div>

                <p className="text-slate-600 text-sm text-center font-medium">
                  {progress.message}
                </p>

                {progress.status === 'processing' && (
                  <div className="mt-6 flex items-start space-x-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>AI Precision Processing:</strong> We are using vision-based models to reconstruct the layout perfectly. This takes longer than simple text extraction but yields much higher quality.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <h3 className="text-2xl font-bold text-slate-900">Conversion Preview</h3>
              <button 
                onClick={reset}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
              >
                Convert Another File
              </button>
            </div>
            <MarkdownPreview 
              markdown={result.markdown} 
              fileName={result.fileName} 
            />
          </div>
        )}
      </main>

      {/* Benefits Grid */}
      {!result && progress.status === 'idle' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-indigo-600" />
              </div>
              <h4 className="text-lg font-bold mb-2">Multi-Column Layouts</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Automatically identifies and sequences text across complex columns, ensuring the correct reading flow is maintained.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-bold mb-2">Structural Tables</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Reads visual tables and converts them into standard GFM Markdown, preserving every cell and alignment.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-bold mb-2">Noise Filtering</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Intelligently ignores decorative images, logos, and artifacts while focusing strictly on converting meaningful content.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-24 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            Powered by Google Gemini Vision. Built for precision.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
