import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'forest',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
});

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart || !containerRef.current) return;
      
      try {
        setError(false);
        setSvg(null);
        
        // Generate a unique ID for this chart instance
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(true);
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-700 text-xs font-mono">
        Errore nel rendering del diagramma Mermaid. Verifica la sintassi.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-[#FDFCF7] p-8 border border-editorial-accent/10">
      {!svg && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-1 bg-editorial-accent/20 mb-2"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Rendering Diagram...</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        dangerouslySetInnerHTML={{ __html: svg || '' }} 
        className="flex justify-center"
      />
    </div>
  );
}
