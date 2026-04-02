import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import 'leaflet/dist/leaflet.css';
import "./App.css";


// Importing components
import Login from "./Login";
import PrisonerLogin from "./PrisonerLogin";
import LawyerLogin from "./LawyerLogin";
import JudgeLogin from "./JudgeLogin";
import PoliceLogin from "./PoliceLogin";
import PrisonerDetails from "./PrisonerDetails";
import LawyerCases from "./Lawyercases";
import CaseDetails from "./CaseDetails";
import JudgeCases from "./JudgeCases";  
import JCaseDetails from "./JCaseDetails";
import Judgeresult from "./Judgeresult";
import MCQ from "./MCQ"; 
import PoliceDashboard from "./PoliceDashboard";
import MindMap from "./mindmap";



const API_KEY = "mysecureapikey123";  // API Key for the backend

function App() {
  const [mongoStatus, setMongoStatus] = useState("Checking connection...");

  useEffect(() => {
    // Checking the MongoDB connection status
    fetch("http://localhost:5000/status", {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => setMongoStatus(data.message))
      .catch(() => setMongoStatus("Failed to connect."));
  }, []);

  return (
    <Router>
      <div className="app-container">


        {/* MongoDB Connection Status */}
        <div className="mongo-status">
        </div>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/PrisonerLogin" element={<PrisonerLogin />} />
          <Route path="/LawyerLogin" element={<LawyerLogin />} />
          <Route path="/JudgeLogin" element={<JudgeLogin />} />
          <Route path="/PoliceLogin" element={<PoliceLogin />} />
          <Route path="/PrisonerDetails" element={<PrisonerDetails />} />
          <Route path="/Lawyercases" element={<LawyerCases />} />
          <Route path="/CaseDetails/:caseId" element={<CaseDetails />} />
          <Route path="/JudgeCases" element={<JudgeCases />} />
          <Route path="/JudgeCases/:caseId" element={<JudgeCases />} />
          <Route path="/" element={<JudgeLogin />} />
          <Route path="/judgecases" element={<JudgeCases />} />
          <Route path="/JCaseDetails/:caseId" element={<JCaseDetails />} />
          <Route path="/Judgeresult/:caseId" element={<Judgeresult />} />
          <Route path="/MCQ/:caseId" element={<MCQ />} />
          <Route path="/police-dashboard" element={<PoliceDashboard />} />
          <Route path="/mindmap" element={<MindMap />} />

          

        </Routes>
      </div>
    </Router>
  );
}

export default App;
