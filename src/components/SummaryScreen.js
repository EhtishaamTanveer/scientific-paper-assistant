import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { extractMetadataFromText } from "../utils/openaiUtils";
import { motion, AnimatePresence } from "framer-motion";
import "./SummaryScreen.css";

const SummaryScreen = () => {
  const [summaries, setSummaries] = useState([]);
  const [metadataMap, setMetadataMap] = useState({});
  const [expandedPaper, setExpandedPaper] = useState(null);
  const [activeSections, setActiveSections] = useState({});
  const [loading, setLoading] = useState(true);
  const summaryRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const stored = localStorage.getItem("summaries");
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setSummaries(parsed);
        
        const meta = {};
        parsed.forEach((paper) => {
          const metadata = extractMetadataFromText(paper.summary);
          meta[paper.title] = metadata;
          
          // Initialize active sections
          setActiveSections(prev => ({
            ...prev,
            [paper.title]: "Introduction"
          }));
        });
        
        setMetadataMap(meta);
      } else {
        navigate("/upload");
      }
      
      // Simulate loading time for animation
      setTimeout(() => {
        setLoading(false);
      }, 800);
    };
    
    fetchData();
  }, [navigate]);

  const parseSections = (summary) => {
    const sections = {};
    const pattern = /^(Introduction|Methods|Results|Conclusion):/gim;
    const parts = summary.split(pattern);
    
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i].trim();
      const val = parts[i + 1]?.trim();
      sections[key] = val;
    }
    
    return sections;
  };

  const handlePaperClick = (title) => {
    setExpandedPaper(expandedPaper === title ? null : title);
    
    // Scroll to element if expanding
    if (expandedPaper !== title && summaryRefs.current[title]) {
      setTimeout(() => {
        summaryRefs.current[title].scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  const handleSectionClick = (paperTitle, sectionName) => {
    setActiveSections(prev => ({
      ...prev,
      [paperTitle]: sectionName
    }));
  };

  return (
    <div className="summary-container">
      <motion.h1 
        className="summary-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="summary-icon">📑</span> Auto-Generated Summaries
      </motion.h1>
      
      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading your summaries...</p>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {summaries.map((paper, index) => {
              const metadata = metadataMap[paper.title] || {};
              const sections = parseSections(paper.summary);
              const isExpanded = expandedPaper === paper.title;
              const activeSection = activeSections[paper.title];
              
              return (
                <motion.div
                  key={paper.title}
                  className={`summary-card ${isExpanded ? 'expanded' : ''}`}
                  ref={el => summaryRefs.current[paper.title] = el}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)" }}
                >
                  <div 
                    className="summary-header"
                    onClick={() => handlePaperClick(paper.title)}
                  >
                    <h3>{paper.title}</h3>
                    <div className="expand-icon">
                      {isExpanded ? '−' : '+'}
                    </div>
                  </div>
                  
                  {/* Preview content always shown */}
                  <div className="summary-meta-grid">
                    <div className="meta-item">
                      <div className="meta-icon">🕒</div>
                      <div className="meta-content">
                        <span className="meta-label">Reading time:</span>
                        <span className="meta-value">{paper.estimatedReadingTime} min</span>
                      </div>
                    </div>
                    
                    <div className="meta-item">
                      <div className="meta-icon">📝</div>
                      <div className="meta-content">
                        <span className="meta-label">Word count:</span>
                        <span className="meta-value">{paper.wordCount}</span>
                      </div>
                    </div>
                    
                    <div className="meta-item">
                      <div className="meta-icon">📅</div>
                      <div className="meta-content">
                        <span className="meta-label">Year:</span>
                        <span className="meta-value">{metadata.estimatedYear || 'Unknown'}</span>
                      </div>
                    </div>
                    
                    <div className="meta-item">
                      <div className="meta-icon">👤</div>
                      <div className="meta-content">
                        <span className="meta-label">Authors:</span>
                        <span className="meta-value">{metadata.authors || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="expanded-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="section-tabs">
                          {["Introduction", "Methods", "Results", "Conclusion"].map((section) => (
                            <button
                              key={section}
                              className={`section-tab ${activeSection === section ? 'active' : ''}`}
                              onClick={() => handleSectionClick(paper.title, section)}
                            >
                              {section}
                            </button>
                          ))}
                        </div>
                        
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeSection}
                            className="section-content"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="section-block">
                              <h4>{activeSection}</h4>
                              <p>{sections[activeSection] || `No ${activeSection.toLowerCase()} section found.`}</p>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                        
                        <div className="paper-actions">
                          <button 
                            className="action-button view-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/reading-view", { state: { paper } });
                            }}
                          >
                            <span className="button-icon">📖</span>
                            Full View
                          </button>
                          <button 
                            className="action-button qa-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/qa", { state: { paper } });
                            }}
                          >
                            <span className="button-icon">💬</span>
                            Ask Questions
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          <motion.div 
            className="navigation-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            
            
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SummaryScreen;