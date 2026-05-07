# UniSummary Pro 🎓
**Sistemi Editoriali di Apprendimento con AI**

UniSummary Pro è una piattaforma avanzata progettata per studenti universitari che devono gestire carichi di studio elevati. Utilizzando Google Gemini 1.5 Pro, l'app trasforma documenti massicci in report di studio strutturati, mappe concettuali Mermaid e sistemi di auto-valutazione.

## 🚀 Avvio Rapido

### Backend (FastAPI)
1. Entra nella cartella backend: `cd backend`
2. Crea un ambiente virtuale: `python -m venv venv`
3. Attivalo: `source venv/bin/activate` (Mac/Linux) o `venv\Scripts\activate` (Windows)
4. Installa le dipendenze: `pip install -r requirements.txt`
5. Crea file `.env` con `FRONTEND_URL`
6. Avvia: `uvicorn main:app --reload`

### Frontend (React)
1. Installa dipendenze: `npm install`
2. Crea file `.env` con `VITE_GEMINI_API_KEY`
3. Avvia: `npm run dev`

---

## ☁️ Deploy

### Frontend (Vercel)
- Collega il repository a Vercel.
- Configura la variabile d'ambiente `VITE_GEMINI_API_KEY`.
- Build Command: `npm run build`
- Output Directory: `dist`

### Backend (Railway)
- Crea un nuovo progetto su Railway.
- Collega la cartella `backend/`.
- Configura `FRONTEND_URL` (l'indirizzo del tuo frontend su Vercel).
- Railway rileverà automaticamente il `requirements.txt` e avvierà il server.

---

## 🔑 Ottenere la API Key
1. Vai su [Google AI Studio](https://aistudio.google.com/).
2. Accedi con il tuo account Google.
3. Clicca su **"Get API Key"**.
4. Copia la chiave e incollala nel tuo file `.env`.

---

## 🛠️ Tecnologie Utilizzate
- **Frontend:** React, Tailwind CSS, Lucide React, Framer Motion, Mermaid.
- **Backend:** FastAPI, PyMuPDF (estrazione PDF), Python-Docx (estrazione Word).
- **AI:** Google Gemini 1.5 Pro (Generazione di contenuti accademici).
