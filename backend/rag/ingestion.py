import fitz  # PyMuPDF
from typing import List, Dict
import os

def parse_pdf(filepath: str) -> str:
    """Extract text from a PDF file."""
    doc = fitz.open(filepath)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def parse_txt(filepath: str) -> str:
    """Extract text from a TXT file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def create_hierarchical_chunks(text: str):
    """
    Placeholder for hierarchical chunking logic.
    For NotebookLLM-style RAG, we split text into larger parent chunks for context,
    and smaller child chunks for precise retrieval.
    """
    # Implementing Langchain splitters later
    pass

class Ingestor:
    def __init__(self, base_upload_dir: str = "uploads"):
        self.base_upload_dir = base_upload_dir
        os.makedirs(base_upload_dir, exist_ok=True)
        
    async def process_file(self, filename: str, content: bytes, subject: str) -> str:
        # Sanitize subject for directory name
        safe_subject = "".join([c if c.isalnum() else "_" for c in subject])
        subject_dir = os.path.join(self.base_upload_dir, safe_subject)
        os.makedirs(subject_dir, exist_ok=True)
        
        filepath = os.path.join(subject_dir, filename)
        with open(filepath, "wb") as f:
            f.write(content)
            
        ext = filename.split('.')[-1].lower()
        if ext == 'pdf':
            text = parse_pdf(filepath)
        elif ext == 'txt':
            text = parse_txt(filepath)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
            
        return text
