import React, { useState, useEffect, useRef } from 'react';
import SourceManager from './components/SourceManager';
import Controls from './components/Controls';
import ChatInterface from './components/ChatInterface';
import FullExamTemplate from './components/FullExamTemplate';
import html2pdf from 'html2pdf.js';

function App() {
    const [sources, setSources] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(() => {
        return localStorage.getItem('lastSelectedSubject') || "";
    });
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);
    const [error, setError] = useState("");
    const contentRef = useRef(null);

    const fetchSubjects = async () => {
        try {
            const res = await fetch('http://localhost:8000/subjects');
            if (res.ok) {
                const data = await res.json();
                setAvailableSubjects(data.subjects);
                // If there's no selected subject but we have available ones, select the first automatically
                if (!localStorage.getItem('lastSelectedSubject') && data.subjects.length > 0) {
                    setSelectedSubject(data.subjects[0]);
                }
            }
        } catch (e) { console.error("Could not fetch subjects"); }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    // Save selected subject to local storage whenever it changes
    useEffect(() => {
        if (selectedSubject) {
            localStorage.setItem('lastSelectedSubject', selectedSubject);
        } else {
            localStorage.removeItem('lastSelectedSubject');
        }
    }, [selectedSubject]);

    const handleSubjectDeleted = () => {
        setGeneratedContent(null);
        setError("");
        fetchSubjects();
    };

    const handleGenerate = async (marks, count, format) => {
        if (!selectedSubject) {
            setError("Please select or enter a subject first.");
            return;
        }
        setError("");
        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/generate-qp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: selectedSubject,
                    marks: marks,
                    count: count,
                    format: format
                })
            });

            const data = await response.json();
            if (response.ok) {
                setGeneratedContent([data.raw_output]);
            } else {
                setError(data.detail || "Failed to generate questions");
            }
        } catch (err) {
            setError("Network error communicating with the backend API.");
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateFull = async () => {
        if (!selectedSubject) {
            setError("Please select or enter a subject first.");
            return;
        }
        setError("");
        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/generate-full-qp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: selectedSubject })
            });

            const data = await response.json();
            if (response.ok) {
                setGeneratedContent([data.raw_output]); // Wrapping in array for consistent rendering
            } else {
                setError(data.detail || "Failed to generate full paper");
            }
        } catch (err) {
            setError("Network error communicating with the backend API.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateQuiz = async (marks, quiz_type) => {
        if (!selectedSubject) {
            setError("Please select or enter a subject first.");
            return;
        }
        setError("");
        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: selectedSubject,
                    marks: marks,
                    quiz_type: quiz_type
                })
            });

            const data = await response.json();
            if (response.ok) {
                setGeneratedContent([data.raw_output]);
            } else {
                setError(data.detail || "Failed to generate quiz");
            }
        } catch (err) {
            setError("Network error communicating with the backend API.");
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleChat = async (message) => {
        if (!selectedSubject) {
            setError("Please select or enter a subject first.");
            return;
        }
        setError("");
        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject: selectedSubject, message: message })
            });

            const data = await response.json();
            if (response.ok) {
                // Return the text inside an array wrapper to match generatedContent parsing pattern
                setGeneratedContent([data.reply]);
            } else {
                setError(data.detail || "Failed to process chat request");
            }
        } catch (err) {
            setError("Network error communicating with the backend API.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!contentRef.current || !generatedContent) {
            setError("No content to download!");
            return;
        }

        const opt = {
            margin: 0.5,
            filename: `${selectedSubject || 'QuestionPaper'}-Internal.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        // Dark text for printing to PDF is typically better.
        // html2pdf clones the styling, so we might want to temporarily force light mode if strictly needed,
        // but for now, let's just dump it as is. 
        html2pdf().set(opt).from(contentRef.current).save();
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>AssessAI</h1>
                <p className="subtitle">AI-Powered Exam Generation Workspace</p>
            </header>

            <main className="main-content">
                <aside className="left-panel">
                    <SourceManager
                        sources={sources}
                        setSources={setSources}
                        subject={selectedSubject}
                        setSubject={setSelectedSubject}
                        availableSubjects={availableSubjects}
                        onSubjectDeleted={handleSubjectDeleted}
                    />
                </aside>

                <section className="right-panel">
                    {error && <div className="error-banner">{error}</div>}

                    <div className="generation-controls">
                        <Controls
                            onGenerate={handleGenerate}
                            onGenerateFull={handleGenerateFull}
                            onDownloadPDF={handleDownloadPDF}
                            onGenerateQuiz={handleGenerateQuiz}
                            isGenerating={isGenerating}
                        />
                    </div>

                    <div className="content-display">
                        {generatedContent ? (
                            <div className="generated-output" ref={contentRef} style={{ background: '#fff', color: '#000', padding: '1rem', borderRadius: '8px' }}>
                                {/* Check if it's the full JSON syllabus (has "metadata" string) or simple text */}
                                {generatedContent[0] && generatedContent[0].includes('"quiz_type"') ? (
                                    <div className="quiz-container" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                            <button
                                                onClick={() => setShowAnswers(!showAnswers)}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    background: showAnswers ? 'var(--bg-ter)' : 'var(--accent)',
                                                    color: showAnswers ? 'var(--text-main)' : 'white',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {showAnswers ? "Hide Answers" : "Show Answers"}
                                            </button>
                                        </div>
                                        <h2 style={{ textAlign: 'center', color: '#000', marginBottom: '0.5rem', fontWeight: 'bold' }}>{JSON.parse(generatedContent[0]).metadata.exam_name}</h2>
                                        <h3 style={{ textAlign: 'center', color: '#000', marginBottom: '1.5rem' }}>{JSON.parse(generatedContent[0]).metadata.subject_name} ({JSON.parse(generatedContent[0]).metadata.max_marks} Marks)</h3>
                                        <hr style={{ border: '1px solid #ccc', marginBottom: '1.5rem' }} />

                                        {JSON.parse(generatedContent[0]).questions.map((q, idx) => (
                                            <div key={idx} style={{ pageBreakInside: 'avoid', marginBottom: '1.5rem', color: '#000' }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{q.q_no}. {q.question}</div>
                                                {q.options && (
                                                    <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                                        {q.options.map((opt, i) => (
                                                            <div key={i}>{opt}</div>
                                                        ))}
                                                    </div>
                                                )}
                                                {showAnswers && (
                                                    <div style={{ marginLeft: '1.5rem', color: '#059669', fontStyle: 'italic', fontWeight: 500 }}>
                                                        Answer: {q.answer}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : generatedContent[0] && generatedContent[0].includes('"metadata"') ? (
                                    <FullExamTemplate paperData={generatedContent[0]} />
                                ) : generatedContent[0] && generatedContent[0].includes('"text_response"') ? (
                                    <>
                                        <h2 style={{ textAlign: 'center', color: '#000', marginBottom: '1rem' }}>{selectedSubject} - AI Response</h2>
                                        <div className="question-block" style={{ color: '#000' }} dangerouslySetInnerHTML={{ __html: JSON.parse(generatedContent[0]).text_response.replace(/\\n/g, '<br/>') }} />
                                    </>
                                ) : (
                                    <>
                                        <h2 style={{ textAlign: 'center', color: '#000', marginBottom: '1rem' }}>{selectedSubject} - Generated Questions</h2>
                                        {generatedContent.map((q, idx) => (
                                            <div key={idx} className="question-block" style={{ color: '#000' }} dangerouslySetInnerHTML={{ __html: q.replace(/\\n/g, '<br/>') }} />
                                        ))}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📝</div>
                                <h3>Your output will appear here</h3>
                                <p>Upload your syllabus or notes, define the subject, and choose a generation format below.</p>
                            </div>
                        )}
                    </div>

                    <div className="chat-container">
                        <ChatInterface onChat={handleChat} isGenerating={isGenerating} />
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;
