import React, { useEffect, useState, useRef } from "react";
import { askQuestionAboutPaper } from "../utils/openaiUtils";
import { motion, AnimatePresence } from "framer-motion";
import "./QAScreen.css";

const QAScreen = () => {
  const [summaries, setSummaries] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const chatEndRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load data with a slight delay to allow for animation
    setTimeout(() => {
      const stored = localStorage.getItem("summaries");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSummaries(parsed);
        if (parsed.length > 0) {
          setSelectedTitle(parsed[0].title);
        }
      }
      setInitialLoading(false);
    }, 800);
    
    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const handleAsk = async () => {
    if (!question.trim() || !selectedTitle) return;
    
    const newEntry = { role: "user", content: question };
    setChatHistory((prev) => [...prev, newEntry]);
    setLoading(true);
    
    try {
      const selectedPaper = summaries.find(p => p.title === selectedTitle);
      const paperText = selectedPaper.fullText;
      
      // Add a small delay to make the experience feel more natural
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const answer = await askQuestionAboutPaper(question, paperText, selectedTitle);
      setChatHistory((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { 
        role: "assistant", 
        content: "❌ I couldn't process your question. Please try again or rephrase your question." 
      }]);
    }
    
    setLoading(false);
    setQuestion("");
  };

  const handleClear = () => {
    // Add confirmation animation
    const clearButton = document.querySelector('.clear-chat-btn');
    if (clearButton) {
      clearButton.classList.add('confirming');
      setTimeout(() => {
        setChatHistory([]);
        clearButton.classList.remove('confirming');
      }, 500);
    } else {
      setChatHistory([]);
    }
  };

  const handleExport = () => {
    if (chatHistory.length === 0) return;
    
    // Add export animation
    const exportButton = document.querySelector('.export-chat-btn');
    if (exportButton) {
      exportButton.classList.add('exporting');
      setTimeout(() => exportButton.classList.remove('exporting'), 1000);
    }
    
    const lines = chatHistory.map(entry =>
      `${entry.role === "user" ? "You" : "AI Assistant"}: ${entry.content}`
    );
    
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedTitle.substring(0, 30)}_Q&A.txt`;
    link.click();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectPaper = (title) => {
    setSelectedTitle(title);
    setDropdownOpen(false);
  };

  // Find selected paper
  const selectedPaper = summaries.find(p => p.title === selectedTitle);

  return (
    <div className="qa-container">
      <motion.div
        className="qa-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2 
          className="qa-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className="qa-icon">🤖</span> Interactive Q&A With Your Paper
        </motion.h2>
        
        {initialLoading ? (
          <div className="initial-loader-container">
            <div className="initial-loader"></div>
            <p>Loading your papers...</p>
          </div>
        ) : (
          <>
            <div className="paper-selection-area">
              <label className="selection-label">Selected Paper:</label>
              <div className="custom-dropdown" ref={dropdownRef}>
                <div 
                  className="selected-paper" 
                  onClick={toggleDropdown}
                >
                  <div className="paper-title-wrapper">
                    <span className="paper-icon">📄</span>
                    <span className="paper-title">{selectedTitle || "Select a paper"}</span>
                  </div>
                  <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
                </div>
                
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div 
                      className="dropdown-options"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {summaries.map((paper, idx) => (
                        <div 
                          key={idx} 
                          className={`dropdown-option ${paper.title === selectedTitle ? 'active' : ''}`}
                          onClick={() => selectPaper(paper.title)}
                        >
                          {paper.title}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {selectedPaper && (
              <motion.div 
                className="paper-meta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="meta-item">
                  <span className="meta-icon">📝</span>
                  <span>{selectedPaper.wordCount} words</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">🕒</span>
                  <span>{selectedPaper.estimatedReadingTime} min read</span>
                </div>
              </motion.div>
            )}
            
            <div className="qa-interaction">
              <div className="textarea-container">
                <textarea
                  className="qa-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about this paper..."
                  disabled={loading}
                />
                <div className="character-count">
                  {question.length > 0 ? `${question.length} characters` : 'Enter your question'}
                </div>
              </div>
              
              <motion.button 
                className="send-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAsk} 
                disabled={loading || !question.trim()}
              >
                {loading ? (
                  <span className="button-content">
                    <span className="loading-spinner"></span>
                    Thinking...
                  </span>
                ) : (
                  <span className="button-content">
                    <span className="send-icon">📤</span>
                    Send
                  </span>
                )}
              </motion.button>
            </div>
            
            <div className="qa-toolbar">
              <motion.button 
                className="qa-secondary-button export-chat-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport} 
                disabled={chatHistory.length === 0}
              >
                <span className="button-icon">💾</span> Export Chat
              </motion.button>
              
              <motion.button 
                className="qa-secondary-button clear-chat-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClear}
                disabled={chatHistory.length === 0}
              >
                <span className="button-icon">🗑️</span> Clear Chat
              </motion.button>
            </div>
            
            <AnimatePresence>
              <motion.div 
                className="qa-chat-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {chatHistory.length === 0 ? (
                  <div className="empty-chat">
                    <div className="empty-chat-icon">💬</div>
                    <p>Ask a question about your paper to start the conversation</p>
                  </div>
                ) : (
                  <div className="qa-chat">
                    <AnimatePresence>
                      {chatHistory.map((entry, idx) => (
                        <motion.div 
                          key={idx} 
                          className={`qa-message ${entry.role === "user" ? "qa-user" : "qa-assistant"}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="message-header">
                            <div className="avatar">
                              {entry.role === "user" ? "👤" : "🤖"}
                            </div>
                            <div className="sender">
                              {entry.role === "user" ? "You" : "AI Assistant"}
                            </div>
                          </div>
                          <div className="message-content">
                            {entry.content}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {loading && (
                      <motion.div 
                        className="typing-indicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="typing-text">AI is thinking...</div>
                      </motion.div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default QAScreen;