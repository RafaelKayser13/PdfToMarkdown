
import React, { useState } from 'react';
import { Eye, Code, Download, Copy, Check } from 'lucide-react';
import { PreviewMode } from '../types';

interface MarkdownPreviewProps {
  markdown: string;
  fileName: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown, fileName }) => {
  const [mode, setMode] = useState<PreviewMode>(PreviewMode.RENDERED);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('.pdf', '.md');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col h-[70vh]">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-slate-200">
          <button
            onClick={() => setMode(PreviewMode.RENDERED)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === PreviewMode.RENDERED 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            onClick={() => setMode(PreviewMode.MARKDOWN)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === PreviewMode.MARKDOWN 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Code className="w-4 h-4 mr-2" />
            Markdown
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopy}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-all"
          >
            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-md shadow-green-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Download .md
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8 bg-white">
        {mode === PreviewMode.RENDERED ? (
          <div 
            className="prose prose-slate max-w-none markdown-body"
            dangerouslySetInnerHTML={{ 
              __html: markdown 
                // Simple transformation for preview. In a real app we'd use a markdown parser.
                .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
                .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br />')
                // Super basic table parser for preview
                .replace(/\|(.+)\|/g, (match) => {
                  const cells = match.split('|').filter(c => c.trim() !== '');
                  return `<tr class="border-b">` + cells.map(c => `<td class="p-2">${c}</td>`).join('') + `</tr>`;
                })
                .replace(/(<tr class="border-b">.*<\/tr>)+/g, match => `<table class="w-full border-collapse my-4 border">${match}</table>`)
            }}
          />
        ) : (
          <pre className="text-sm font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
            {markdown}
          </pre>
        )}
      </div>
    </div>
  );
};

export default MarkdownPreview;
