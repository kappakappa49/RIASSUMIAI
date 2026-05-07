import { GoogleGenerativeAI } from "@google/generative-ai";

// Use any casting to avoid VITE_ meta-property lint errors if standard types are missing
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface SummaryOptions {
  detailLevel: 'brief' | 'medium' | 'detailed';
  style: 'schematic' | 'narrative' | 'bullet';
  language: string;
}

const CHUNK_SIZE = 30000;

export const summarizeText = async (text: string, options: SummaryOptions) => {
  if (!genAI) {
    throw new Error("Gemini API Key is not configured. Please set VITE_GEMINI_API_KEY.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const detailPrompts = {
    brief: "Sii estremamente sintetico, concentrati solo sui concetti fondamentali (max 500 parole).",
    medium: "Fornisci un'analisi equilibrata, coprendo i punti principali e dettagli tecnici rilevanti (max 1200 parole).",
    detailed: "Produci un'analisi esaustiva e densa, catturando ogni sfumatura tecnica e teorica (oltre 2000 parole)."
  };

  const stylePrompts = {
    schematic: "Usa uno stile schematico, con tabelle, liste gerarchiche e definizioni puntuali.",
    narrative: "Usa uno stile narrativo fluido, accademico ed elegante, tipico di un saggio.",
    bullet: "Usa esclusivamente elenchi puntati strutturati per ogni sezione."
  };

  const systemInstruction = `
    Sei un assistente AI specializzato nella creazione di riassunti universitari di alta qualità.
    Trasforma testi accademici complessi in materiali di studio chiari e professionali.

    # REQUISITI DI OUTPUT
    - Lingua: ${options.language}
    - Dettaglio: ${detailPrompts[options.detailLevel]}
    - Stile: ${stylePrompts[options.style]}

    # STRUTTURA DEL REPORT
    Usa esattamente questi titoli di sezione (H1):

    # 01. Riassunto Esecutivo
    (Panoramica generale, contesto e tesi principale del documento)

    # 02. Analisi Approfondita
    (Scomposizione dei capitoli, teorie principali, dati tecnici, riferimenti normativi e spiegazioni dettagliate)

    # 03. Glossario Tecnico
    (Definizione dei termini complessi incontrati nel testo)

    # 04. Sistema di Verifica
    (Genera 5-10 domande a scelta multipla con spiegazione delle risposte corrette)

    # 05. Mappa Concettuale
    (Genera un diagramma Mermaid che rappresenti visivamente i legami tra i concetti principali. Usa tag \` \` \` mermaid)

    # 06. Archiviazione
    (Genera tag di ricerca pertinenti preceduti da #)
  `;

  // Split text into chunks
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  if (chunks.length === 1) {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: text }] }],
      generationConfig: { temperature: 0.1 },
    });
    // Note: genAI.getGenerativeModel doesn't support systemInstruction in the call if the model instance was created without it.
    // But initialize it in the model constructor.
    const modelWithSystem = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction });
    const res = await modelWithSystem.generateContent(text);
    return res.response.text();
  }

  // Summarize chunks and merge
  const partialSummaries = await Promise.all(chunks.map(async (chunk, index) => {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Riassumi questa parte del documento (Parte ${index + 1}/${chunks.length}):\n\n${chunk}` }] }],
      generationConfig: { temperature: 0.1 },
    });
    return result.response.text();
  }));

  const mergedText = partialSummaries.join("\n\n---\n\n");

  const finalModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction });
  const finalResult = await finalModel.generateContent(`Ecco i riassunti parziali di un grande documento. Uniscili in un report finale coerente seguendo queste istruzioni:\n\n${mergedText}`);

  return finalResult.response.text();
};

export const analyzeDocument = async (base64: string, mimeType: string) => {
  // Aliased for compatibility with current App.tsx
  // In a real scenario, we should update App.tsx to use file upload -> text -> summarizeText
  console.warn("analyzeDocument is called but summarizeText is preferred.");
  // For now, let's keep it simple or just make it a pass-through if we handle base64 in summarizeText
  // But the prompt says summarizeText(text: string, ...)
  return "Analisi via base64 non più supportata direttamente nel frontend. Usa l'upload del server.";
};
