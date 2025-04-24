import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useNavigate } from "react-router-dom";
import "./ReadingView.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const ReadingView = () => {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSummaries = localStorage.getItem("summaries");
    const storedPdfFiles = localStorage.getItem("pdfFiles");

    if (storedSummaries && storedPdfFiles) {
      const papers = JSON.parse(storedSummaries);
      const pdfs = JSON.parse(storedPdfFiles);

      setSelectedPaper(papers[0]);

      // Convert base64 to Uint8Array
      const base64Data = pdfs[0].data.split(",")[1]; // remove data URL header
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      setPdfData(bytes); // set usable PDF data
    } else {
      navigate("/upload");
    }
  }, [navigate]);

  return (
    <div className="reading-container">
      <div className="left-pane">
        <h3>📄 Paper Viewer</h3>
        {pdfData ? (
          <Document file={{ data: pdfData }} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
            {Array.from(new Array(numPages), (_, index) => (
              <Page key={index} pageNumber={index + 1} width={500} />
            ))}
          </Document>
        ) : (
          <p>Loading PDF...</p>
        )}
      </div>

      <div className="right-pane">
        <h3>🧠 Summary</h3>
        {selectedPaper ? (
          <>
            <p><strong>Title:</strong> {selectedPaper.title}</p>
            <p><strong>Word Count:</strong> {selectedPaper.wordCount}</p>
            <p><strong>Reading Time:</strong> {selectedPaper.estimatedReadingTime} min</p>

            <div className="summary-tabs">
              {["Introduction", "Methods", "Results", "Conclusion"].map((section, idx) => {
                const regex = new RegExp(`${section}:`, "i");
                const split = selectedPaper.summary.split(regex);
                const content = split[1] || "Not found.";
                return (
                  <div key={idx} className="summary-section">
                    <h4>{section}</h4>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: content.replace(
                          /\b([A-Z]{3,})\b/g,
                          "<mark>$1</mark>"
                        ),
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <button className="qa-button" onClick={() => navigate("/summary")}>
              🔙 Back to Summary View
            </button>
          </>
        ) : (
          <p>No summary found.</p>
        )}
      </div>
    </div>
  );
};

export default ReadingView;
