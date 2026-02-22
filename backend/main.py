from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from pydantic import BaseModel
import shutil
import json

# Import RAG components
from rag.ingestion import Ingestor
from rag.retriever import Retriever
from rag.generator import Generator

app = FastAPI(title="Question Paper Generator API")

# Initialize RAG components
ingestor = Ingestor(base_upload_dir="uploads")
retriever = Retriever(persist_directory="chroma_db")
generator = Generator()

# Setup CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    subject: str
    marks: int
    count: int
    format: str # 'internal' or 'semester'
    custom_prompt: Optional[str] = None

class GenerateFullRequest(BaseModel):
    subject: str

class ChatRequest(BaseModel):
    subject: str
    message: str

class QuizRequest(BaseModel):
    subject: str
    marks: int
    quiz_type: str # 'mcq' or 'fill_blanks'

@app.get("/")
def read_root():
    return {"status": "ok", "message": "QP Generator Backend Running"}

def get_or_create_subject_cos(subject: str, context: str):
    subject_dir = os.path.join("uploads", subject)
    os.makedirs(subject_dir, exist_ok=True)
    co_file = os.path.join(subject_dir, "cos.json")
    
    if os.path.exists(co_file):
        try:
            with open(co_file, "r") as f:
                data = json.load(f)
                if "course_outcomes" in data:
                    return data["course_outcomes"]
        except Exception as e:
            print(f"Error reading COs: {e}")
            
    # Generate them if missing or corrupted
    cos = generator.generate_cos(subject, context)
    with open(co_file, "w") as f:
        json.dump({"course_outcomes": cos}, f)
    return cos

@app.get("/subjects")
def get_subjects():
    if not os.path.exists("uploads"):
        return {"subjects": []}
    subjects = [d for d in os.listdir("uploads") if os.path.isdir(os.path.join("uploads", d))]
    return {"subjects": subjects}

@app.get("/subjects/{subject}/files")
def get_subject_files(subject: str):
    subject_dir = os.path.join("uploads", subject)
    if not os.path.exists(subject_dir):
        return {"files": []}
        
    # Exclude system files like cos.json
    files = [f for f in os.listdir(subject_dir) if os.path.isfile(os.path.join(subject_dir, f)) and f != "cos.json"]
    return {"files": files}

@app.delete("/subjects/{subject}/files/{filename}")
def delete_subject_file(subject: str, filename: str):
    subject_dir = os.path.join("uploads", subject)
    file_path = os.path.join(subject_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        # 1. Delete physical file
        os.remove(file_path)
        
        # 2. Delete vectors from ChromaDB
        deletion_success = retriever.delete_document(subject, filename)
        
        return {"status": "success", "message": f"Deleted {filename} successfully.", "vector_deleted": deletion_success}
    except Exception as e:
        print(f"Error deleting file {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/subjects/{subject}")
def delete_subject(subject: str):
    subject_dir = os.path.join("uploads", subject)
    
    try:
        # 1. Delete physical directory and all its files
        if os.path.exists(subject_dir):
            shutil.rmtree(subject_dir)
            
        # 2. Delete entire vector collection from ChromaDB
        deletion_success = retriever.delete_subject(subject)
        
        return {"status": "success", "message": f"Deleted subject {subject} completely.", "vector_deleted": deletion_success}
    except Exception as e:
        print(f"Error deleting subject {subject}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_document(subject: str = Form(...), files: List[UploadFile] = File(...)):
    if not subject:
         raise HTTPException(status_code=400, detail="Subject is required for context isolation")
         
    saved_files = []
    for file in files:
        content = await file.read()
        try:
            # Extract text
            text = await ingestor.process_file(file.filename, content, subject)
            
            # Simple chunking for now (can be enhanced to hierarchical later)
            # Assuming 1000 char chunks for simplicity in this version
            chunk_size = 1000
            chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
            metadatas = [{"source": file.filename, "subject": subject} for _ in chunks]
            
            # Add to vector store
            print(f"Adding {len(chunks)} chunks to vector store for {file.filename} under subject {subject}")
            retriever.add_documents(chunks, metadatas, subject)
            saved_files.append(file.filename)
        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
            
    return {"message": f"Successfully processed {len(saved_files)} files.", "files": saved_files}

@app.post("/generate-qp")
async def generate_qp(request: GenerateRequest):
    try:
        # Construct query based on subject and focus
        query = f"Provide relevant concepts and details for question generation about {request.subject}"
        
        # Retrieve context
        results = retriever.search(query, request.subject, k=5)
        context = "\\n\\n".join([r.page_content for r in results])
        
        if not context:
            context = "No direct context found in uploaded materials. Use general knowledge."
            
        # Extract or Create persistent Course Outcomes
        cos = get_or_create_subject_cos(request.subject, context)
        
        # Generate questions
        generated_text = generator.generate_question(
            context=context,
            marks=request.marks,
            subject=request.subject,
            count=request.count,
            cos=cos,
            custom_prompt=request.custom_prompt
        )
        
        # Simple parsing logic (assuming the model lists questions clearly)
        # Note: we are returning the raw text for now, the frontend can render markdown
        questions = [generated_text]
        
        return {
            "status": "success",
            "message": f"Generated questions for {request.marks} marks.",
            "questions": questions,
            "raw_output": generated_text
        }
    except Exception as e:
        print(f"Error generating QP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-full-qp")
async def generate_full_qp(request: GenerateFullRequest):
    try:
        # Construct broadly sweeping query 
        query = f"Provide a complete, comprehensive overview of the syllabus, main topics, and key concepts for {request.subject}"
        
        # Retrieve context (fetch a bit more for a full paper)
        results = retriever.search(query, request.subject, k=10)
        context = "\\n\\n".join([r.page_content for r in results])
        
        if not context:
            context = "No direct context found in uploaded materials. Use general knowledge about the subject."
        
        # Extract or Create persistent Course Outcomes
        cos = get_or_create_subject_cos(request.subject, context)
        
        # Generate full exam
        generated_text = generator.generate_full_internal_exam(
            context=context,
            subject=request.subject,
            cos=cos
        )
        
        return {
            "status": "success",
            "message": "Generated Full Internal Exam Paper.",
            "raw_output": generated_text
        }
    except Exception as e:
        print(f"Error generating full QP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-quiz")
async def generate_quiz_endpoint(request: QuizRequest):
    try:
        # Construct query based on subject and format
        query = f"Provide relevant concepts and details for {request.quiz_type} questions about {request.subject}"
        
        # Retrieve context
        results = retriever.search(query, request.subject, k=8)
        context = "\\n\\n".join([r.page_content for r in results])
        
        if not context:
            context = "No direct context found in uploaded materials. Use general knowledge."
            
        generated_text = generator.generate_quiz(
            context=context,
            subject=request.subject,
            marks=request.marks,
            quiz_type=request.quiz_type
        )
        
        return {
            "status": "success",
            "message": f"Generated {request.marks} {request.quiz_type} questions.",
            "raw_output": generated_text
        }
    except Exception as e:
        print(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_context(request: ChatRequest):
    try:
        results = retriever.search(request.message, request.subject, k=8)
        context = "\\n\\n".join([r.page_content for r in results])
        
        if not context:
            context = "No direct context found in uploaded materials. Use general knowledge."
            
        # Extract or Create persistent Course Outcomes
        cos = get_or_create_subject_cos(request.subject, context)
            
        reply = generator.generate_chat(context=context, subject=request.subject, message=request.message, cos=cos)
        
        return {
            "status": "success",
            "reply": reply
        }
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
