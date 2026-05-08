import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import cors from "cors";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Configure Multer for memory storage
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // File Extraction Endpoint
  app.post("/api/upload", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let text = "";
      const buffer = req.file.buffer;
      const mimetype = req.file.mimetype;
      const originalname = req.file.originalname.toLowerCase();

      if (mimetype === "application/pdf" || originalname.endsWith(".pdf")) {
        const data = await pdf(buffer);
        text = data.text;
      } else if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        originalname.endsWith(".docx")
      ) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (mimetype === "text/plain" || originalname.endsWith(".txt")) {
        text = buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      res.json({ 
        fileName: req.file.originalname, 
        text, 
        charCount: text.length 
      });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: "Failed to extract text from file: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
