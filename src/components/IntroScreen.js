// IntroScreen.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./IntroScreen.css";

const IntroScreen = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  const handleStart = () => {
    setIsVisible(false);
    setTimeout(() => navigate("/upload"), 500);
  };
  
  return (
    <div className="intro-container">
      <div className="intro-content">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
          transition={{ duration: 0.8 }}
          className="intro-header"
        >
          <div className="logo-container">
            <div className="logo-icon">🧠</div>
          </div>
          <h1 className="title">Scientific Paper Summarizer</h1>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="instructions"
        >
          Upload one or more research papers, and we'll generate clear summaries 
          and let you ask questions from them. Get started by uploading your papers on the next screen.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="button-container"
        >
          <button className="start-button" onClick={handleStart}>
            <span>Get Started</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="feature-cards"
        >
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Multiple Formats</h3>
            <p>Support for PDF, DOC, and TXT files</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast Processing</h3>
            <p>Get summaries in seconds</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Ask Questions</h3>
            <p>Interactive Q&A with your papers</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IntroScreen;