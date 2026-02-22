from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

import json

class Generator:
    def __init__(self):
        # Using Groq's 70B model for fast, high-quality generation
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model_id = "llama-3.3-70b-versatile" 
        
    def generate_cos(self, subject: str, context: str) -> list:
        prompt = f"""
        You are an expert curriculum designer. 
        Generate exactly 5 Course Outcomes (CO1 to CO5) for the subject: {subject}, based loosely on the following context.
        Return ONLY a JSON object with a list of strings:
        {{
            "course_outcomes": [
                "CO1: Explain the...",
                "CO2: Apply...",
                "CO3: Analyze...",
                "CO4: Evaluate...",
                "CO5: Design..."
            ]
        }}
        Context: {context}
        """
        response = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model_id,
            response_format={"type": "json_object"}
        )
        try:
            return json.loads(response.choices[0].message.content).get("course_outcomes", [])
        except:
            return ["CO1: Analyze basics", "CO2: Apply concepts", "CO3: Design systems", "CO4: Evaluate performance", "CO5: Create solutions"]

    def generate_question(self, context: str, marks: int, subject: str, count: int, cos: list, custom_prompt: str = None) -> str:
        prompt = f"""
        You are an expert academic question paper generator for the subject: {subject}.
        CRITICAL: Extract and select questions EXACTLY as they appear in the provided context materials (which serve as a question bank). 
        Do NOT invent or generate your own new questions. Only use questions that are explicitly present in the text.
        Randomly select different topics to ensure a wide coverage across all modules/units. Do NOT repeat questions from previous tests or within this generation.
        
        Generate exactly {count} question(s) suitable for a {marks}-mark allocation.
        
        Guidelines:
        - 2 marks: Short, direct answer, definition or basic concept.
        - 10 marks/16 marks: Long answer, analytical, design-oriented, or comprehensive explanation.
        - Each 16 mark question generated MUST have an internal 'OR' choice.
        
        Context:
        {context}
        
        Additional Instructions:
        {custom_prompt if custom_prompt else "Ensure questions map to relevant Course Outcomes (CO1-CO5)."}
        
        You MUST output ONLY a valid JSON object matching the St. Xavier's template schema below. No markdown formatting outside the JSON block.
        {{
            "metadata": {{
                "subject_code": "CUSTOM", 
                "subject_name": "{subject}",
                "class_name": "Custom Generation",
                "exam_name": "Practice Questions",
                "time": "N/A",
                "max_marks": "{marks * count} Marks"
            }},
            "course_outcomes": {json.dumps(cos)},
            "part_a": [ (Include only if marks == 2. Array of objects: {{ "q_no": 1, "question": "...", "marks": 2, "cl": "Un", "co": "CO1" }} ) ],
            "part_b": [ (Include only if marks >= 10. Array of objects where each has option_a and option_b if 16m with OR is requested. Or just option_a if no OR choice. Format: {{ "q_no": 10, "option_a": {{ "sub_q": "a)", "question": "...", "marks": {marks}, "cl": "Un", "co": "CO1" }}, "option_b": {{...}} }} ) ]
        }}
        """
        
        response = self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=self.model_id,
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content

    def generate_full_internal_exam(self, context: str, subject: str, cos: list) -> str:
        prompt = f"""
        You are an expert academic examiner for: {subject}.
        Generate a complete Internal Exam Question Paper adhering STRICTLY to the following "St. Xavier's Catholic College of Engineering" format.
        
        CRITICAL: Extract and select questions EXACTLY as they appear in the provided context materials (which serve as a question bank). 
        Do NOT invent or generate your own new questions. Only use questions that are explicitly present in the text.
        
        Maximum Marks: 50 Marks
        Time: 90 Minutes
        
        Structure constraints:
        - Part-A: 9 Questions x 2 Marks = 18 Marks total. Generate exactly 9 short-answer questions.
        - Part-B: 2 Questions x 16 Marks = 32 Marks total. Each 16-mark question MUST have an internal 'OR' choice (i.e. Q10a OR Q10b, and Q11a OR Q11b). Generate exactly 4 descriptive questions matching this layout.
        
        Metadata constraints (Include these tags for EVERY question generated):
        - Cognitive Level (CL): Tag as [Re] for Remember, [Un] for Understand, [Ap] for Apply, [An] for Analyze, [Ev] for Evaluate, or [Cr] for Create.
        - Course Outcome (CO): Tag as [CO1], [CO2], [CO3], [CO4], or [CO5].
        
        Use the following syllabus/material context to base your extraction upon (do not invent topics outside of this context). 
        CRITICAL: Randomly select topics from across ALL available units/context to ensure a highly balanced paper. Do NOT clump questions from a single unit. Ensure all 5 Course Outcomes (CO1-CO5) are covered across the paper.
        {context}
        
        You MUST output ONLY a valid JSON object with the following schema, and absolutely no other text, markdown formatting, or code blocks outside the JSON:
        {{
            "metadata": {{
                "subject_code": "IT22611", 
                "subject_name": "{subject}",
                "class_name": "B.Tech. Information Technology (Semester:6)",
                "exam_name": "Internal Exam I, 2025 - 2026 [EVEN]",
                "time": "90 Minutes",
                "max_marks": "50 Marks"
            }},
            "course_outcomes": {json.dumps(cos)},
            "part_a": [
                {{ "q_no": 1, "question": "...", "marks": 2, "cl": "Un", "co": "CO1" }},
                ... 9 questions total
            ],
            "part_b": [
                {{
                    "q_no": 10,
                    "option_a": {{ "sub_q": "a)", "question": "...", "marks": 16, "cl": "Un", "co": "CO1" }},
                    "option_b": {{ "sub_q": "b)", "question": "...", "marks": 16, "cl": "Un", "co": "CO1" }}
                }},
                {{
                    "q_no": 11,
                    "option_a": {{ "sub_q": "a)", "question": "...", "marks": 16, "cl": "Ap", "co": "CO2" }},
                    "option_b": {{ "sub_q": "b)", "question": "...", "marks": 16, "cl": "Ap", "co": "CO2" }}
                }}
            ]
        }}
        """
        
        response = self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=self.model_id,
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content

    def generate_chat(self, context: str, subject: str, message: str, cos: list) -> str:
        prompt = f"""
        You are an expert AI teaching assistant and academic examiner for the subject: {subject}.
        Use the following syllabus/material context to comprehensively answer the user's request.
        
        Context:
        {context}
        
        User Request: {message}
        
        CRITICAL INSTRUCTION:
        If the user is asking you to generate questions (e.g., "give me 10 2 mark questions", "generate a paper", etc.), you MUST output ONLY a valid JSON object matching the St. Xavier's template schema below. 
        DO NOT use the `text_response` key if generating questions. You MUST use the root keys `metadata`, `course_outcomes`, `part_a`, and `part_b`.
        If they specify only 2 marks, put them ALL in `part_a`, and leave `part_b` as an empty array []. 
        If they specify only 16 marks, put them ALL in `part_b` (each with option_a and option_b), and leave `part_a` as an empty array [].
        If they don't specify marks, default to a balanced Part A (2 marks) and Part B (16 marks with OR choice).
        
        If the user is NOT asking for questions (e.g., "summarize unit 1", "explain this concept"), you must STILL output a JSON object, but place your text/HTML response inside a single field called `text_response`, and DO NOT include `metadata`, `part_a`, or `part_b`.

        Example Schema for Question Generation (Output ONLY JSON):
        {{
            "metadata": {{
                "subject_code": "CUSTOM", 
                "subject_name": "{subject}",
                "class_name": "Custom Generation",
                "exam_name": "Custom Request",
                "time": "N/A",
                "max_marks": "N/A"
            }},
            "course_outcomes": {json.dumps(cos)},
            "part_a": [ 
                {{ "q_no": 1, "question": "...", "marks": 2, "cl": "Un", "co": "CO1" }} 
            ],
            "part_b": [ 
                {{
                    "q_no": 10,
                    "option_a": {{ "sub_q": "a)", "question": "...", "marks": 16, "cl": "Un", "co": "CO1" }},
                    "option_b": {{ "sub_q": "b)", "question": "...", "marks": 16, "cl": "Un", "co": "CO1" }}
                }}
            ]
        }}
        
        Example Schema for non-question/normal chat responses (Output ONLY JSON):
        {{
            "text_response": "Your full explanation with <b>HTML</b> formatting here."
        }}
        """
        response = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model_id,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content

    def generate_quiz(self, context: str, subject: str, marks: int, quiz_type: str) -> str:
        prompt = f"""
        You are an expert academic quiz generator for the subject: {subject}.
        CRITICAL: Extract and frame questions based EXACTLY on the provided context materials. 
        
        Task: Generate a {marks}-question {quiz_type.upper()} quiz. Each question is worth 1 mark.
        
        Instructions for {quiz_type}:
        - If 'mcq' (Multiple Choice Questions): Generate a question and exactly 4 options (A, B, C, D) with the correct option identified.
        - If 'fill_blanks': Generate a statement with a clear blank (___) and provide the correct exact word/phrase answer.
        
        Context:
        {context}
        
        You MUST output ONLY a valid JSON object matching the schema below.
        
        Example Schema for MCQ (Output ONLY JSON):
        {{
            "metadata": {{ "subject_name": "{subject}", "exam_name": "Multiple Choice Quiz", "max_marks": "{marks}" }},
            "quiz_type": "mcq",
            "questions": [
                {{ "q_no": 1, "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "B) ..." }}
            ]
        }}
        
        Example Schema for Fill in the Blanks (Output ONLY JSON):
        {{
            "metadata": {{ "subject_name": "{subject}", "exam_name": "Fill in the Blanks Quiz", "max_marks": "{marks}" }},
            "quiz_type": "fill_blanks",
            "questions": [
                {{ "q_no": 1, "question": "The powerhouse of the cell is the ___.", "answer": "Mitochondria" }}
            ]
        }}
        """
        
        response = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model_id,
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content
