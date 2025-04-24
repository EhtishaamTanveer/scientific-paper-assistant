// UploadScreen.js
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { extractTextFromPDF } from "../utils/pdfUtils";
import { summarizeTextWithOpenAI } from "../utils/openaiUtils";
import { motion, AnimatePresence } from "framer-motion";
import "./UploadScreen.css";

const UploadScreen = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState({});
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [singlePaperProgress, setSinglePaperProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files).filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (uploadedFiles.length === 0) {
      showToast("Please upload PDF files only");
      return;
    }
    
    setFiles(uploadedFiles);
    setFileStatuses({});
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      
      if (droppedFiles.length === 0) {
        showToast("Please upload PDF files only");
        return;
      }
      
      setFiles(droppedFiles);
      setFileStatuses({});
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newStatuses = { ...fileStatuses };
    delete newStatuses[files[index].name];
    setFileStatuses(newStatuses);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      showToast("Please upload at least one paper");
      return;
    }

    setLoading(true);
    const summaries = [];
    const base64Files = [];
    const statusMap = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFileIndex(i + 1);
      setSinglePaperProgress(10);
      setStageMessage("Converting to base64...");
      statusMap[file.name] = "processing";
      setFileStatuses({ ...statusMap });

      try {
        const base64 = await fileToBase64(file);
        setSinglePaperProgress(30);
        setStageMessage("Extracting text...");
        base64Files.push({ name: file.name, data: base64 });

        const text = await extractTextFromPDF(file);
        setSinglePaperProgress(60);

        console.log("Extracted text length:", text.length);
        setStageMessage("Generating summary...");
        const summary = await summarizeTextWithOpenAI(text, file.name);
        console.log("Generated summary:", summary);

        const wordCount = text.split(/\s+/).length;
        const estimatedReadingTime = Math.ceil(wordCount / 200);
        setSinglePaperProgress(100);

        summaries.push({
          title: file.name,
          summary: summary || "Summary not available.",
          fullText: text,
          wordCount,
          estimatedReadingTime,
        });

        statusMap[file.name] = "done";
        setFileStatuses({ ...statusMap });
      } catch (error) {
        console.error("❌ Error processing file:", file.name, error);
        summaries.push({
          title: file.name,
          summary: "Summary generation failed.",
          fullText: "",
          wordCount: 0,
          estimatedReadingTime: 0,
        });
        statusMap[file.name] = "error";
        setFileStatuses({ ...statusMap });
      }

      setSinglePaperProgress(0);
    }

    localStorage.setItem("summaries", JSON.stringify(summaries));
    localStorage.setItem("pdfFiles", JSON.stringify(base64Files));
    setLoading(false);
    setCurrentFileIndex(null);
    
    // Animate transition to next page
    document.querySelector('.upload-container').classList.add('fade-out');
    setTimeout(() => navigate("/summary"), 500);
  };

  const getStatusIcon = (status) => {
    if (status === "done") return <span className="status-icon done">✓</span>;
    if (status === "error") return <span className="status-icon error">×</span>;
    if (status === "processing") return <span className="status-icon processing"></span>;
    return <span className="status-icon idle">•</span>;
  };

  const progressPercentage =
    files.length > 0 && currentFileIndex
      ? Math.floor((currentFileIndex / files.length) * 100)
      : 0;
      
  const formatFileName = (name) => {
    if (name.length > 30) {
      return name.substring(0, 20) + '...' + name.substring(name.length - 7);
    }
    return name;
  };

  return (
    <motion.div 
      className="upload-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="upload-card"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.h2 
          className="upload-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span className="title-icon">📄</span> Upload Scientific Papers
        </motion.h2>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              className="loading-container"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="progress-section">
                <div className="progress-wrapper overall">
                  <div className="progress-info">
                    <span className="progress-label">Overall Progress</span>
                    <span className="progress-percentage">{progressPercentage}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="progress-description">
                    Analyzing paper {currentFileIndex} of {files.length}
                  </p>
                </div>

                <div className="progress-wrapper current">
                  <div className="progress-info">
                    <span className="progress-label">Current Paper</span>
                    <span className="progress-percentage">{singlePaperProgress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${singlePaperProgress}%` }}
                    ></div>
                  </div>
                  <p className="progress-description">
                    {stageMessage}
                  </p>
                </div>
              </div>
              
              <motion.div 
                className="processing-animation"
                animate={{ 
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <div className="circle"></div>
                <div className="circle"></div>
                <div className="circle"></div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className={`drop-zone ${dragActive ? "drag-active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleButtonClick}
              >
                <div className="drop-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 18V21H4V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="drop-content">
                  <p>Drag & drop your PDF files here</p>
                  <span>or</span>
                  <button className="browse-button">Browse Files</button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="file-input"
                />
              </div>

              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div 
                    className="file-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4>Selected Files:</h4>
                    <ul>
                      {files.map((file, index) => (
                        <motion.li 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="file-item"
                        >
                          {getStatusIcon(fileStatuses[file.name])} 
                          <span className="file-name">{formatFileName(file.name)}</span>
                          <span className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                          <button 
                            className="remove-file" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                          >
                            ×
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                className="process-button"
                onClick={handleProcess}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: files.length > 0 ? 1 : 0.7, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                disabled={files.length === 0}
              >
                <span className="button-text">Process Papers</span>
                <span className="button-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <motion.div 
        className="features-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="feature">
          <div className="feature-icon">🔍</div>
          <h3>Smart Analysis</h3>
          <p>Advanced AI extracts key insights from complex papers</p>
        </div>
        <div className="feature">
          <div className="feature-icon">⚡</div>
          <h3>Fast Processing</h3>
          <p>Multi-stage pipeline for efficient document handling</p>
        </div>
        <div className="feature">
          <div className="feature-icon">💬</div>
          <h3>Conversational</h3>
          <p>Interact with your papers through natural questions</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UploadScreen;