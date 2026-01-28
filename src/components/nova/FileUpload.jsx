import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function FileUpload({ onDataExtracted }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile) => {
    const validTypes = ['text/plain', 'text/csv', 'application/json', 'application/pdf'];
    const validExtensions = ['.txt', '.csv', '.json', '.pdf'];
    
    const hasValidExtension = validExtensions.some(ext => 
      selectedFile.name.toLowerCase().endsWith(ext)
    );
    
    if (!validTypes.includes(selectedFile.type) && !hasValidExtension) {
      setError("Please upload a TXT, CSV, JSON, or PDF file");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    // For text files, read directly
    if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onDataExtracted(e.target.result);
        setIsProcessing(false);
      };
      reader.readAsText(selectedFile);
      return;
    }

    // For other files, upload and extract
    const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
    
    const extractionSchema = {
      type: "object",
      properties: {
        transcript: { 
          type: "string",
          description: "The full meeting transcript or conversation content"
        },
        participants: {
          type: "array",
          items: { type: "string" },
          description: "List of participant names if identifiable"
        }
      }
    };

    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: extractionSchema
    });

    if (result.status === "success" && result.output) {
      onDataExtracted(result.output.transcript || JSON.stringify(result.output, null, 2));
    } else {
      setError("Could not extract text from file. Please try a different format.");
    }
    
    setIsProcessing(false);
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : file 
              ? 'border-emerald-300 bg-emerald-50/50' 
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.json,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-600">Processing file...</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="text-slate-500"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-700">
                Drop your file here or click to browse
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports TXT, CSV, JSON, and PDF files
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-600 text-sm mt-3"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </motion.div>
  );
}