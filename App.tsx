
import React, { useState } from 'react';
import { FileText, Cpu, ChevronRight, Loader2, Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
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
        message: 'Lendo arquivo PDF...'
      });

      const { pdf, numPages } = await getPdfInfo(file);
      
      setProgress(prev => ({
        ...prev,
        status: 'processing',
        totalPages: numPages,
        message: `Iniciando processamento de ${numPages} páginas...`
      }));

      let fullMarkdown = '';

      for (let i = 1; i <= numPages; i++) {
        setProgress(prev => ({
          ...prev,
          currentPage: i,
          status: 'processing',
          message: `Processando página ${i} de ${numPages} (Modo Gratuito Ativo)...`
        }));

        const base64Image = await renderPageToImage(pdf, i);
        const pageMarkdown = await convertPageToMarkdown(base64Image);
        
        fullMarkdown += pageMarkdown + '\n\n---\n\n';
        
        // RPM Safety: No nível gratuito do Gemini, o limite é de 15 requisições por minuto.
        // Esperar ~4.2 segundos garante que não ultrapassamos 15 requisições em 60 segundos.
        if (i < numPages) {
          const waitTime = 4200; 
          for (let seconds = 0; seconds < 4; seconds++) {
            const remaining = 4 - seconds;
            setProgress(prev => ({ ...prev, message: `Página ${i} concluída. Aguardando ${remaining}s para evitar limites de cota...` }));
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      setResult({
        markdown: fullMarkdown,
        fileName: file.name
      });
      
      setProgress(prev => ({
        ...prev,
        status: 'completed',
        message: 'Documento convertido com sucesso!'
      }));

    } catch (error: any) {
      console.error('Erro na aplicação:', error);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        message: error.message || 'Erro inesperado durante a conversão.'
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
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">PDF to Markdown</h1>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Cota Gratuita Otimizada</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Conversor Inteligente de PDFs</h2>
          <p className="text-slate-500">Transforme documentos complexos em Markdown limpo usando IA de alta performance.</p>
        </div>

        {!result && (
          <div className="max-w-3xl mx-auto space-y-6">
            <FileUploader 
              onFileSelect={setFile} 
              selectedFile={file} 
              onClear={reset}
              isProcessing={progress.status === 'processing' || progress.status === 'reading'}
            />

            {file && progress.status === 'idle' && (
              <button
                onClick={startConversion}
                className="w-full flex items-center justify-center py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
              >
                Converter Agora Gratuitamente
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            )}

            {progress.status !== 'idle' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {progress.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : progress.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : progress.status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    )}
                    <span className="font-bold text-xs uppercase tracking-tighter text-slate-500">{progress.status}</span>
                  </div>
                  {progress.totalPages > 0 && (
                    <span className="text-xs font-bold text-slate-400">Página {progress.currentPage} / {progress.totalPages}</span>
                  )}
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                  <div 
                    className={`h-full transition-all duration-700 ${progress.status === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${progress.totalPages > 0 ? (progress.currentPage / progress.totalPages) * 100 : 0}%` }}
                  />
                </div>

                <p className={`text-sm text-center ${progress.status === 'error' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                  {progress.message}
                </p>

                {progress.status === 'processing' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-tight">
                      <strong>Dica:</strong> Estamos processando uma página a cada 4 segundos para manter sua conta no plano gratuito sem interrupções.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between max-w-5xl mx-auto mb-4">
              <h3 className="text-xl font-bold">Resultado da Conversão</h3>
              <button onClick={reset} className="text-sm font-bold text-blue-600 hover:underline">Novo PDF</button>
            </div>
            <MarkdownPreview markdown={result.markdown} fileName={result.fileName} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
