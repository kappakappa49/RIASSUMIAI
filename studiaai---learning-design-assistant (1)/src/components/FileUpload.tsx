import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { sounds } from '@/src/lib/sounds';

interface FileUploadProps {
  onAnalyze: (file: File) => void;
  isLoading: boolean;
}

export default function FileUpload({ onAnalyze, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      sounds.playClick();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      sounds.playClick();
    }
  };

  const startAnalysis = () => {
    if (file) {
      sounds.playSuccess();
      onAnalyze(file);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div
        className={cn(
          "relative border-2 border-editorial-accent rounded-none p-12 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] cursor-pointer",
          dragActive ? "bg-editorial-muted" : "bg-white",
          isLoading && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!file) {
            sounds.playClick();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.docx"
          onChange={handleChange}
        />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6">
                <Upload className="w-12 h-12 text-editorial-accent" strokeWidth={1} />
              </div>
              <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-editorial-text mb-2">Ingest Document</h3>
              <p className="text-sm font-serif italic text-editorial-text/50">PDF, TXT, or DOCX (Max 20MB)</p>
              
              <div className="mt-8 px-6 py-2 border border-editorial-accent text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-accent hover:text-white transition-all">
                Select File
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 w-full max-w-lg"
            >
              <div className="flex items-center gap-6 p-6 bg-editorial-muted w-full border border-editorial-accent/20">
                <div className="p-4 bg-white border border-editorial-accent">
                  <FileText className="w-8 h-8 text-editorial-accent" strokeWidth={1} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold uppercase tracking-widest text-editorial-text truncate">{file.name}</p>
                  <p className="text-xs font-serif italic text-editorial-text/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    setFile(null);
                  }}
                  className="p-2 hover:bg-editorial-accent hover:text-white transition-all border border-editorial-accent/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 border border-editorial-accent border-t-editorial-accent-transparent animate-spin mb-6" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-editorial-accent animate-pulse">Processing Analysis</p>
          </div>
        )}
      </div>

      {file && !isLoading && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startAnalysis}
          className="w-full bg-editorial-accent text-white py-6 text-xs font-bold uppercase tracking-[0.4em] hover:bg-editorial-accent/90 transition-all shadow-[10px_10px_0px_#F5F2EB]"
        >
          Avvia Analisi Editoriale
        </motion.button>
      )}
    </div>
  );
}
