# AssessAI (formerly NotebookQP)
**Premium AI-Powered Exam & Quiz Generation Platform**

AssessAI is an advanced, RAG-based (Retrieval-Augmented Generation) examination and syllabus assessment workspace. It allows educators to instantly generate comprehensive internal exams, custom quizzes (MCQs and Fill in the Blanks), and unstructured short/long answer questions directly from their own lecture notes, syllabus blueprints, and question banks.

This platform bridges the gap between raw educational materials and structured, ready-to-print assessments. By utilizing localized vector embeddings and high-performance Large Language Models, AssessAI ensures that generated questions are strictly grounded in the provided curriculum, preventing AI hallucinations.

---

## 🏗️ Technical Architecture & Stack Justification

AssessAI is built on a modern decoupled architecture, separating a React-based interactive frontend from a heavy, AI-focused Python backend.

### 1. Frontend (User Interface)
- **Framework:** React (built with Vite for extreme speed and HMR).
- **Styling:** Custom Vanilla CSS. We implemented a premium **Glassmorphism** design language featuring radial mesh gradients, translucent floating panels (`backdrop-filter: blur`), and dynamic hover physics to replicate the feel of a high-end enterprise SaaS tool.
- **Exporting:** `html2pdf.js` is utilized for client-side PDF generation. It parses the DOM, applies `page-break-inside: avoid` CSS rules to prevent question splitting, and renders high-quality print-ready documents without requiring heavy backend PDF libraries.

### 2. Backend (API & Processing)
- **Framework:** FastAPI (Python). Chosen over Flask/Django because of its native support for asynchronous programming (`async def`), which is critical when handling long-running AI generation requests and concurrent network calls to AI providers.
- **Document Processing:** `PyPDF2` (for PDF text extraction) and `langchain-community` (RecursiveCharacterTextSplitter) are used to parse massive lecture notes into manageable semantic chunks.

### 3. AI & RAG Engine (The Core)
- **Vector Database (ChromaDB):** An entirely local vector storage engine. Instead of sending thousands of pages of notes to an LLM at once (which exceeds context windows and is expensive), ChromaDB securely stores document chunks as mathematical vectors locally on the host machine.
- **Embeddings Model:** `HuggingFace (all-MiniLM-L6-v2)`. A lightweight, incredibly fast embedding model that converts English text into dense vectors. It runs locally, meaning no API costs are incurred during the embedding of massive textbooks.
- **LLM Provider (Groq API):** We utilize Groq's Llama 3.3 70B Versatile model. Groq relies on specialized LPU (Language Processing Unit) hardware rather than GPUs, resulting in generation speeds that are an order of magnitude faster than standard OpenAI or Anthropic endpoints. This allows 50-question multi-page exams to be generated in seconds rather than minutes.

---

## 🧠 Backend Workflow: How It Works

1. **Ingestion (`ingestion.py`):** When a user drops a PDF into a subject folder, the backend slices the document into 1000-character chunks with a 200-character overlap (to preserve context across paragraph breaks). These chunks are embedded via HuggingFace and shoved into a ChromaDB collection uniquely named after the chosen Subject.
2. **Retrieval (`retriever.py`):** When the user clicks "Generate 50 MCQs", the prompt itself is converted into a vector. ChromaDB performs a "k-nearest neighbors" similarity search across the subject's localized database and retrieves only the actual paragraphs of the textbook relevant to generating questions.
3. **Generation (`generator.py`):** The retrieved localized text is injected directly into a massive, heavily engineered prompt. The prompt forces the Groq Llama 3.3 70B model into a strict persona.
   - For internal exams, the prompt utilizes robust JSON enforcing, demanding output in the exact format of *St. Xavier's Catholic College of Engineering* (Part A 9x2 marks, Part B 2x16 marks with OR choices), including CO (Course Outcome) and CL (Cognitive Level) mapping.
4. **Resolution (`main.py`):** The backend intercepts the raw JSON or Markdown string from Groq, parses it, handles HTTP 500 fallbacks in case of LLM formatting errors, and fires the formatted response back to the React frontend for visual rendering.

---

## 🚀 Key Features

- **Document-Grounded Knowledge Base:** Complete isolation of context. DevOps questions will only ever be generated using DevOps pdfs.
- **St. Xavier's Catholic College formatting:** Programmatically locked JSON schema adherence for perfect internal exam templates.
- **Dynamic Quiz Generator:** Instant generation of 10, 25, or 50 marks MCQ / Fill in the blank formats with automated answer hiding/revealing.
- **Freeform Chat Engine:** Unrestricted chat UI that actively parses the ChromaDB vector maps to act as a localized Teaching Assistant.

---

## ⚠️ Known Limitations

1. **API Rate Limiting:** The platform currently relies on the free tier of the Groq API. If processing massive documents or generating excessive sequential queries, Groq will trigger a `429 Rate Limit Error` (typically resetting after a few minutes). Upgrading to a paid Groq API tier instantly resolves this.
2. **Tabular/Math Extraction:** `PyPDF2` is excellent at extracting raw text, but it struggles heavily with complex mathematical formulas, calculus notations, and complex nested tables found in engineering documents. These may be corrupted when embedded into the vector database.
3. **Strict JSON Parsing Fragility:** For the St. Xavier Template, the backend demands raw, perfect JSON from the LLM. If the LLM hallucinates a trailing comma or misses a bracket inside a massive 1500-line response, the `json.loads()` intercept will fail, requiring a regeneration.
4. **Local Host Constraints:** Because ChromaDB and HuggingFace embeddings are running locally alongside the FastAPI backend, the initial ingestion of massive textbook PDFs (e.g., a 400-page book) is heavily bottlenecked by the host computer's CPU speed. 

---

## 💻 Local Migration & Setup Guide

### Prerequisites
- NodeJS (v18+)
- Python (3.10+)
- A [Groq API Key](https://console.groq.com/)

### Step 1: Setting up the FastAPI Backend

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - **Windows:** `.venv\Scripts\activate`
   - **Mac/Linux:** `source .venv/bin/activate`
4. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create your `.env` file! Inside the `backend` folder, create a file named `.env` and add your Groq API Key:
   ```env
   GROQ_API_KEY=gsk_your_api_key_here
   ```
6. Start the server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   *The backend should now be running on `http://localhost:8000`.*

### Step 2: Setting up the React Frontend

1. Open a new, separate terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.

---

## 🔒 100% Offline Deployment (No API Keys Required)

By default, AssessAI uses the **Groq API** (Llama-3.3-70B) for the language model. However, if you are deploying this on a powerful workstation (e.g., an i9 processor, 32GB System RAM, and 24GB VRAM like an RTX 3090/4090), you can run the entire platform **completely offline** for maximum privacy and zero API rate limits.

### Recommended Offline Model: `Qwen 2.5 (32B)`
The `Qwen2.5-32B-Instruct` model (quantized to 4-bit) is perfectly optimized for a 24GB VRAM graphics card. It takes up ~19GB of memory, leaving enough headroom for massive textbook contexts. 

### Step 1: Install Ollama
1. Download and install [Ollama](https://ollama.com/) on the host machine.
2. Open a terminal and run the following command to download the 32B logic engine:
   ```bash
   ollama run qwen2.5:32b
   ```
   *(This will download an ~20GB file. Let it finish).*

### Step 2: Reroute the Backend
1. Open `backend/rag/generator.py` in your code editor.
2. Locate the `__init__` function inside the `Generator` class (around line 10).
3. **Replace**:
   ```python
   self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
   self.model_id = "llama-3.3-70b-versatile" 
   ```
4. **With**:
   ```python
   from openai import OpenAI
   
   # Point the backend to your local Ollama server
   self.client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
   self.model_id = "qwen2.5:32b"
   ```

Restart your FastAPI server. AssessAI is now running perfectly offline on your graphics card.
