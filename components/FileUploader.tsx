
import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, selectedFile, onClear, isProcessing }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert('File size exceeds 100MB limit.');
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!selectedFile ? (
        <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isProcessing ? 'bg-gray-100 border-gray-300' : 'bg-white border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-4 bg-blue-100 rounded-full mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <p className="mb-2 text-sm text-gray-700">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">PDF (MAX. 100MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="application/pdf" 
            onChange={handleFileChange}
            disabled={isProcessing}
          />
        </label>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 truncate max-w-xs">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            onClick={onClear}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
            title="Remove file"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
