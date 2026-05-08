from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import docx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content_type = file.content_type
        filename = file.filename.lower()
        text = ""

        # PDF Extraction
        if content_type == "application/pdf" or filename.endswith(".pdf"):
            pdf_bytes = await file.read()
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text()
            doc.close()

        # DOCX Extraction
        elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or filename.endswith(".docx"):
            docx_bytes = await file.read()
            from io import BytesIO
            doc = docx.Document(BytesIO(docx_bytes))
            text = "\n".join([para.text for para in doc.paragraphs])

        # TXT Extraction
        elif content_type == "text/plain" or filename.endswith(".txt"):
            text_bytes = await file.read()
            text = text_bytes.decode("utf-8")

        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        return {"text": text, "filename": file.filename, "length": len(text)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
