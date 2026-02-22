import React, { useRef, useEffect } from 'react';
import { Upload, FileText, Link as LinkIcon, Activity, Trash2 } from 'lucide-react';

const SourceManager = ({ sources, setSources, subject, setSubject, availableSubjects = [], onSubjectDeleted }) => {
    const fileInputRef = useRef(null);
    const [isCreatingNewSubject, setIsCreatingNewSubject] = React.useState(false);

    // Auto-fetch files for the selected subject
    useEffect(() => {
        if (!subject) {
            setSources([]);
            return;
        }

        const fetchSubjectFiles = async () => {
            try {
                const response = await fetch(`http://localhost:8000/subjects/${subject}/files`);
                if (response.ok) {
                    const data = await response.json();
                    setSources(data.files.map(f => ({
                        id: f, // using filename as id
                        name: f,
                        type: 'file',
                        status: 'ready'
                    })));
                } else {
                    setSources([]);
                }
            } catch (err) {
                console.error("Failed to fetch subject files");
                setSources([]);
            }
        };

        // Add a small debounce if the user is typing
        const timeoutId = setTimeout(() => {
            fetchSubjectFiles();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [subject, setSources]);

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        // Add to local state first (mock upload feeling)
        const newSources = files.map(f => ({
            id: Math.random().toString(36).substring(7),
            name: f.name,
            type: 'file',
            status: 'uploading'
        }));
        setSources(prev => [...prev, ...newSources]);

        // Perform actual upload
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        if (!subject) {
            alert("Please enter a subject before uploading materials.");
            setSources(prev => prev.filter(s => !newSources.find(n => n.id === s.id)));
            return;
        }
        formData.append('subject', subject);

        try {
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setSources(prev => prev.map(s => {
                    if (newSources.find(n => n.id === s.id)) {
                        return { ...s, status: 'ready' };
                    }
                    return s;
                }));
            }
        } catch (error) {
            console.error("Upload failed", error);
            setSources(prev => prev.map(s => {
                if (newSources.find(n => n.id === s.id)) {
                    return { ...s, status: 'error' };
                }
                return s;
            }));
        }
    };

    const handleDeleteFile = async (filename) => {
        if (!window.confirm(`Are you sure you want to delete ${filename}? This will remove it from the knowledge base.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/subjects/${subject}/files/${filename}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSources(prev => prev.filter(s => s.name !== filename));
            } else {
                alert("Failed to delete file.");
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Network error while deleting.");
        }
    };

    const handleDeleteSubject = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete the entire subject "${subject}"? This removes all files and vectors.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/subjects/${subject}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setSubject("");
                setSources([]);
                if (onSubjectDeleted) onSubjectDeleted();
            } else {
                alert("Failed to delete subject.");
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Network error while deleting subject.");
        }
    };

    return (
        <div className="source-manager">
            <div className="subject-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Subject Context</h3>
                    {subject && availableSubjects.includes(subject) && (
                        <button
                            onClick={handleDeleteSubject}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#ef4444' }}
                            title="Delete Entire Subject"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                {isCreatingNewSubject || availableSubjects.length === 0 ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="New Subject Name..."
                            className="subject-input"
                            autoFocus
                        />
                        {availableSubjects.length > 0 && (
                            <button
                                onClick={() => { setIsCreatingNewSubject(false); setSubject(availableSubjects[0] || ""); }}
                                className="btn"
                                style={{ padding: '0.5rem', minWidth: 'auto' }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                ) : (
                    <select
                        value={subject}
                        onChange={(e) => {
                            if (e.target.value === '___CREATE_NEW___') {
                                setIsCreatingNewSubject(true);
                                setSubject("");
                            } else {
                                setSubject(e.target.value);
                            }
                        }}
                        className="subject-input"
                    >
                        <option value="" disabled>Select a subject...</option>
                        {availableSubjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="___CREATE_NEW___">+ Create New Subject...</option>
                    </select>
                )}
            </div>

            <div className="source-section mt-8" style={{ marginTop: '2rem' }}>
                <h3>Knowledge Base</h3>

                <div
                    className="upload-box"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="mx-auto block" size={32} style={{ margin: '0 auto 1rem' }} />
                    <p>Click to upload Syllabus, Notes, or Question Banks (PDF, TXT)</p>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".pdf,.txt"
                    />
                </div>

                <div className="source-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sources.map(source => (
                        <div key={source.id} className="source-item" style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', background: 'rgba(26, 32, 44, 0.4)',
                            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            cursor: 'default'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.3)';
                                e.currentTarget.style.borderColor = 'rgba(255, 90, 95, 0.3)';
                                e.currentTarget.style.background = 'rgba(26, 32, 44, 0.8)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.background = 'rgba(26, 32, 44, 0.4)';
                            }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(255, 90, 95, 0.1)', borderRadius: '8px', display: 'flex' }}>
                                <FileText size={20} color="var(--accent)" />
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{source.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-sec)', textTransform: 'uppercase' }}>
                                    {source.status} {source.status === 'uploading' && <Activity size={12} className="inline animate-spin ml-2" />}
                                </div>
                            </div>
                            {source.status === 'ready' && (
                                <button
                                    onClick={() => handleDeleteFile(source.name)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#ef4444' }}
                                    title="Delete File from Knowledge Base"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                    {sources.length === 0 && (
                        <div style={{
                            padding: '2rem 1rem',
                            textAlign: 'center',
                            background: 'rgba(26, 32, 44, 0.2)',
                            borderRadius: '12px',
                            border: '1px dashed rgba(255,255,255,0.05)'
                        }}>
                            <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>
                                No sources uploaded yet.
                            </p>
                            <p style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                Upload PDFs or TXT files to build your knowledge base.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SourceManager;
