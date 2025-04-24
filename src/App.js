import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import IntroScreen from "./components/IntroScreen";
import UploadScreen from "./components/UploadScreen";
import SummaryScreen from "./components/SummaryScreen";
import QAScreen from "./components/QAScreen";
import ReadingView from "./components/ReadingView"; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IntroScreen />} />
        <Route path="/upload" element={<UploadScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="/qa" element={<QAScreen />} />
        <Route path="/reading-view" element={<ReadingView />} />
      </Routes>
    </Router>
  );
}

export default App;
