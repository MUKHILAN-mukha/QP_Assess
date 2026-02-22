import React, { useState } from 'react';
import { PenTool, BrainCircuit, RefreshCw } from 'lucide-react';

const Controls = ({ onGenerate, onGenerateFull, onDownloadPDF, onGenerateQuiz, isGenerating }) => {
    const [format, setFormat] = useState('internal'); // 'internal', 'semester', 'mcq', 'fill_blanks'

    return (
        <div className="controls-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div className="format-selector" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-sec)' }}>
                    <input type="radio" value="internal" checked={format === 'internal'} onChange={(e) => setFormat(e.target.value)} />
                    Internal Assessment
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-sec)' }}>
                    <input type="radio" value="semester" checked={format === 'semester'} onChange={(e) => setFormat(e.target.value)} />
                    Semester Exam
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-sec)' }}>
                    <input type="radio" value="mcq" checked={format === 'mcq'} onChange={(e) => setFormat(e.target.value)} />
                    Quiz (MCQ)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-sec)' }}>
                    <input type="radio" value="fill_blanks" checked={format === 'fill_blanks'} onChange={(e) => setFormat(e.target.value)} />
                    Fill in the Blanks
                </label>
            </div>

            {(format === 'internal' || format === 'semester') ? (
                <>
                    <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            className={`btn ${isGenerating ? 'loading' : ''}`}
                            disabled={isGenerating}
                            onClick={() => onGenerate(2, 9, format)}
                        >
                            {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <PenTool size={18} />}
                            Generate 2 Marks
                        </button>

                        <button
                            className={`btn primary ${isGenerating ? 'loading' : ''}`}
                            disabled={isGenerating}
                            onClick={() => onGenerate(10, 5, format)}
                        >
                            {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                            Generate 10 Marks
                        </button>

                        <button
                            className={`btn ${isGenerating ? 'loading' : ''}`}
                            disabled={isGenerating}
                            onClick={() => onGenerate(16, 5, format)}
                            style={{ background: 'var(--bg-ter)', borderColor: 'var(--accent)', color: 'var(--text-main)' }}
                        >
                            {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <PenTool size={18} />}
                            Generate 16 Marks
                        </button>
                    </div>

                    <div className="button-group mt-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                        <button
                            className={`btn ${isGenerating ? 'loading' : ''}`}
                            disabled={isGenerating}
                            onClick={onGenerateFull}
                            style={{ background: 'var(--accent)', color: 'white' }}
                        >
                            {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                            Generate Full Internal Exam
                        </button>

                        <button
                            className="btn"
                            onClick={onDownloadPDF}
                            style={{ background: 'var(--bg-ter)', border: '1px solid var(--border)' }}
                        >
                            Download as PDF
                        </button>
                    </div>
                </>
            ) : (
                <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        className={`btn ${isGenerating ? 'loading' : ''}`}
                        disabled={isGenerating}
                        onClick={() => onGenerateQuiz(10, format)}
                    >
                        {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                        10 Questions
                    </button>

                    <button
                        className={`btn primary ${isGenerating ? 'loading' : ''}`}
                        disabled={isGenerating}
                        onClick={() => onGenerateQuiz(25, format)}
                    >
                        {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                        25 Questions
                    </button>

                    <button
                        className={`btn ${isGenerating ? 'loading' : ''}`}
                        disabled={isGenerating}
                        onClick={() => onGenerateQuiz(50, format)}
                        style={{ background: 'var(--bg-ter)', borderColor: 'var(--accent)', color: 'var(--text-main)' }}
                    >
                        {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                        50 Questions
                    </button>

                    <button
                        className="btn"
                        onClick={onDownloadPDF}
                        style={{ background: 'var(--bg-ter)', border: '1px solid var(--border)', marginLeft: '1rem' }}
                    >
                        Download PDF
                    </button>
                </div>
            )}
        </div>
    );
};

export default Controls;
