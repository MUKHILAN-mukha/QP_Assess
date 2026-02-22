import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

const ChatInterface = ({ onChat, isGenerating }) => {
    const [prompt, setPrompt] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim() || isGenerating) return;

        onChat(prompt);
        setPrompt("");
    };

    return (
        <div className="chat-wrapper" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-1.5rem', left: '1.5rem', fontSize: '0.8rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                <Sparkles size={14} /> Custom Refinement Prompt
            </div>
            <form onSubmit={handleSubmit} className="chat-input-wrapper">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask any question, summarize units, or generate custom mark layouts..."
                    className="chat-input"
                    disabled={isGenerating}
                />
                <button type="submit" className="chat-submit" disabled={!prompt.trim() || isGenerating}>
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
