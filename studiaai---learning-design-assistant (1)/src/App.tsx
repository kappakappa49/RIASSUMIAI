/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BookOpen, 
  CheckSquare, 
  FileSearch, 
  Download, 
  Github, 
  Sparkles,
  Upload,
  Map as MapIcon,
  HelpCircle,
  Tag as TagIcon,
  Settings,
  Globe,
  Layers,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { summarizeText, SummaryOptions } from './services/geminiService';
import FileUpload from './components/FileUpload';
import Mermaid from './components/Mermaid';
import { cn } from './lib/utils';
import { sounds } from './lib/sounds';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type TabType = 'summary' | 'map' | 'quiz' | 'tags';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<SummaryOptions>({
    detailLevel: 'medium',
    style: 'schematic',
    language: 'Italian'
  });

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Upload to backend for text extraction
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${(import.meta as any).env?.VITE_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Errore nel caricamento del file.");
      }

      const { text } = await uploadRes.json();

      if (!text || text.length < 10) {
        throw new Error("Il documento non contiene abbastanza testo per l'analisi.");
      }

      // 2. Call Gemini for summarization
      const res = await summarizeText(text, options);
      setContent(res);
      sounds.playSuccess();
    } catch (err: any) {
      console.error("Error processing file:", err);
      sounds.playError();
      setError(err?.message || "Si è verificato un errore imprevisto.");
    } finally {
      setIsLoading(false);
    }
  };


  const extractMermaidCode = (text: string) => {
    const match = text.match(/```mermaid\s+([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  const getTabContent = (type: TabType) => {
    if (!content) return null;

    // Split on major headers (e.g., # 01. or ## 01.)
    const sections = content.split(/(?=^#+\s0[1-4]\.\s)/gm);
    
    switch (type) {
      case 'summary':
        const summary = sections.find(s => s.match(/01\.\s+Riassunto\s+Esecutivo/i));
        return summary || sections[0] || content;
      case 'map':
        const mapSection = sections.find(s => s.match(/02\.\s+Mappa\s+Concettuale/i));
        const code = mapSection ? extractMermaidCode(mapSection) : extractMermaidCode(content);
        return code ? <Mermaid chart={code} /> : <p className="text-slate-500 font-serif italic text-sm">Mappa concettuale non rilevata. Assicurati che il report contenga un blocco di codice Mermaid.</p>;
      case 'quiz':
        const quiz = sections.find(s => s.match(/03\.\s+Sistema\s+di\s+Verifica/i));
        return quiz || "Sezione Quiz non trovata.";
      case 'tags':
        const tags = sections.find(s => s.match(/04\.\s+Archiviazione/i));
        return tags || "Sezione Tag non trovata.";
    }
  };

  const downloadContent = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudiaAI_AnalysisFull_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSectionAsPDF = async () => {
    const element = document.getElementById('section-to-pdf');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FDFCF7',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`StudiaAI_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-editorial-bg/80 backdrop-blur-md border-b-2 border-editorial-accent">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-end justify-between pb-6">
          <div className="flex flex-col">
            <p className="uppercase tracking-[0.2em] text-[10px] font-bold mb-1 opacity-60">Learning Design & Analysis • v1.5</p>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-serif italic font-light tracking-tight">StudiaAI</h1>
              <div className="h-6 w-[1px] bg-editorial-accent/20" />
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">Analysis engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {content && (
              <button 
                onClick={() => {
                  sounds.playClick();
                  downloadContent();
                }}
                className="flex items-center gap-2 px-6 py-2 bg-editorial-accent text-white rounded-none hover:bg-editorial-accent/90 transition-all text-xs font-bold uppercase tracking-widest"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
            )}
            <div className="h-8 w-[1px] bg-editorial-accent/10" />
            <a href="#" className="p-2 text-editorial-text/60 hover:text-editorial-text transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!content ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto text-center py-12"
            >
              <div className="mb-12 border-b-2 border-editorial-accent pb-8 text-left">
                <p className="uppercase tracking-[0.2em] text-xs font-bold mb-4 opacity-60">00. Welcome</p>
                <h2 className="text-7xl font-serif leading-[1.1] italic font-light text-editorial-text tracking-tighter">
                  Intelligenza <span className="underline decoration-1 underline-offset-8">Editoriale</span> per l'apprendimento profondo.
                </h2>
                <p className="text-xl text-editorial-text/70 mt-6 font-serif italic max-w-2xl">
                  Analizza volumi massicci di documenti e trasformali in percorsi di studio strutturati, mappe gerarchiche e sistemi di verifica.
                </p>
              </div>

              {/* Options Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40">
                    <Layers className="w-3 h-3" />
                    <span>Livello di Dettaglio</span>
                  </div>
                  <div className="flex gap-2">
                    {(['brief', 'medium', 'detailed'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => { sounds.playSwitch(); setOptions(prev => ({ ...prev, detailLevel: level })); }}
                        className={cn(
                          "px-3 py-1 text-[10px] border transition-all uppercase tracking-tighter uppercase",
                          options.detailLevel === level ? "bg-editorial-accent text-white border-editorial-accent" : "border-slate-200 hover:border-editorial-accent/40"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40">
                    <Palette className="w-3 h-3" />
                    <span>Stile Output</span>
                  </div>
                  <div className="flex gap-2">
                    {(['schematic', 'narrative', 'bullet'] as const).map(style => (
                      <button
                        key={style}
                        onClick={() => { sounds.playSwitch(); setOptions(prev => ({ ...prev, style: style })); }}
                        className={cn(
                          "px-3 py-1 text-[10px] border transition-all uppercase tracking-tighter",
                          options.style === style ? "bg-editorial-accent text-white border-editorial-accent" : "border-slate-200 hover:border-editorial-accent/40"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40">
                    <Globe className="w-3 h-3" />
                    <span>Lingua</span>
                  </div>
                  <select
                    value={options.language}
                    onChange={(e) => { sounds.playSwitch(); setOptions(prev => ({ ...prev, language: e.target.value })); }}
                    className="w-full px-3 py-1 text-[10px] border border-slate-200 bg-transparent uppercase tracking-tighter focus:outline-none focus:border-editorial-accent"
                  >
                    <option value="Italian">Italiano</option>
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                  </select>
                </div>
              </div>

              <FileUpload onAnalyze={handleFileSelect} isLoading={isLoading} />

              
              {error && (
                <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-serif italic text-left">
                  <span className="font-bold uppercase tracking-widest text-[10px] block mb-1">Errore Riscontrato:</span>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20 text-left">
                {[
                  { id: "01", icon: BookOpen, title: "Deep Dive Analysis", desc: "Riassunti esecutivi con distinzioni teoriche sottili e definizioni normative." },
                  { id: "02", icon: MapIcon, title: "Hierarchical Maps", desc: "Diagrammi Mermaid per la visualizzazione delle strutture gerarchiche." },
                  { id: "03", icon: CheckSquare, title: "Verification Systems", desc: "Quiz e Flashcards progettati per il ripasso rapido e l'archiviazione." }
                ].map((item, i) => (
                  <div key={i} className="group cursor-default">
                    <p className="text-[10px] font-mono font-bold text-editorial-text/40 mb-2">{item.id}.</p>
                    <div className="w-full h-[2px] bg-editorial-accent/10 mb-4 group-hover:bg-editorial-accent transition-colors" />
                    <h3 className="font-serif italic text-xl text-editorial-text mb-2">{item.title}</h3>
                    <p className="text-sm text-editorial-text/60 leading-relaxed font-serif uppercase tracking-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              {/* Sidebar Tabs */}
              <div className="lg:col-span-3 space-y-4">
                <div className="border-b border-editorial-accent/20 pb-4 mb-6">
                  <p className="uppercase tracking-widest text-[10px] font-bold opacity-40">Sezioni Report</p>
                </div>
                {[
                  { id: 'summary', label: '01. Riassunto Esecutivo', icon: FileSearch },
                  { id: 'map', label: '02. Mappa Concettuale', icon: MapIcon },
                  { id: 'quiz', label: '03. Sistema di Verifica', icon: HelpCircle },
                  { id: 'tags', label: '04. Archiviazione', icon: TagIcon },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sounds.playSwitch();
                      setActiveTab(tab.id as TabType);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-4 text-xs font-bold uppercase tracking-widest transition-all border",
                      activeTab === tab.id 
                        ? "bg-editorial-accent text-white border-editorial-accent" 
                        : "bg-white text-editorial-text/60 hover:text-editorial-text border-slate-200"
                    )}
                  >
                    <span>{tab.label}</span>
                    <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "opacity-100" : "opacity-20")} />
                  </button>
                ))}

                <div className="mt-12 p-6 bg-editorial-muted border-l-4 border-editorial-accent">
                  <div className="flex items-center gap-2 text-editorial-text font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
                    <Sparkles className="w-3 h-3" />
                    <span>Learning Tip</span>
                  </div>
                  <p className="text-xs text-editorial-text/70 leading-relaxed font-serif italic">
                    I percorsi editoriali funzionano meglio quando si alterna la lettura analitica alla verifica tramite flashcards.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    sounds.playClick();
                    setContent(null);
                  }}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-4 bg-white border border-editorial-accent text-editorial-text/60 text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-accent hover:text-white transition-all shadow-sm"
                >
                  <Upload className="w-3 h-3" />
                  Carica Altro
                </button>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-9 bg-white border border-editorial-accent/20 flex flex-col min-h-[700px] shadow-[20px_20px_0px_#F5F2EB]">
                <div id="section-to-pdf" className="p-12 flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="markdown-content"
                    >
                      {activeTab === 'map' ? (
                        <div className="flex flex-col gap-6">
                           <h2 className="text-xs uppercase tracking-[0.3em] font-bold border-b border-editorial-accent/20 pb-2 mb-4">Mappa Gerarchica Mermaid</h2>
                           {getTabContent('map')}
                        </div>
                      ) : (
                        <div className="prose prose-slate max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof getTabContent(activeTab) === 'string' ? getTabContent(activeTab) as string : ''}</ReactMarkdown>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="p-6 border-t border-editorial-accent/10 flex justify-end">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      downloadSectionAsPDF();
                    }}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-editorial-accent text-editorial-text text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-accent hover:text-white transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Scarica Sezione (PDF)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-24 py-12 border-t-2 border-editorial-accent/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] uppercase tracking-[0.3em] font-bold text-editorial-text/30">
          <p>© 2024 StudiaAI • Professional Learning Design System</p>
          <div className="flex gap-8">
            <span>Report Generated via Gemini 1.5</span>
            <span>Editorial Aesthetic v1.0</span>
          </div>
        </div>
      </footer>

      <style>{`
        .markdown-content table { border-collapse: collapse; width: 100%; margin: 2rem 0; border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a; }
        .markdown-content th, .markdown-content td { padding: 1rem 0.75rem; text-align: left; border-bottom: 1px solid #f0f0f0; }
        .markdown-content th { background-color: transparent; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #1a1a1a; }
        .markdown-content td { font-family: 'Playfair Display', serif; font-size: 14px; }
        .markdown-content h2 { margin-top: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3em; color: #1a1a1a; margin-bottom: 2rem; border-bottom: 1px solid rgba(26, 26, 26, 0.1); padding-bottom: 0.5rem; }
        .markdown-content h3 { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-style: italic; font-weight: 400; color: #1a1a1a; margin-top: 3rem; margin-bottom: 1.5rem; }
        .markdown-content p { margin-bottom: 1.5rem; line-height: 1.8; color: #1a1a1a; font-family: 'Playfair Display', serif; font-size: 1.125rem; }
        .markdown-content ul { list-style-type: none; margin-left: 0; margin-bottom: 2rem; }
        .markdown-content li { position: relative; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #1a1a1a; font-family: 'Playfair Display', serif; }
        .markdown-content li::before { content: '—'; position: absolute; left: 0; color: rgba(26, 26, 26, 0.3); }
        .markdown-content strong { color: #1a1a1a; font-weight: 700; font-family: 'Inter', sans-serif; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        .markdown-content blockquote { border-left: 1px solid #1a1a1a; padding: 2rem; background: #fdfcf7; italic; font-family: 'Playfair Display', serif; font-size: 1.25rem; color: #1a1a1a; margin: 2.5rem 0; box-shadow: inset 10px 0 0 #f5f2eb; }
        .markdown-content em { font-style: italic; font-family: 'Playfair Display', serif; border-bottom: 1px solid rgba(26, 26, 26, 0.2); }
      `}</style>
    </div>
  );
}

