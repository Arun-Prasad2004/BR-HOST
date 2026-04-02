import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CaseDetails.css";

const API_KEY = "mysecureapikey123";

const CaseDetails = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentExists, setAssessmentExists] = useState(false);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/cases/${caseId}`, {
          method: "GET",
          headers: { "x-api-key": API_KEY },
        });

        if (!response.ok) {
          throw new Error("Case not found or server error.");
        }

        const caseData = await response.json();
        setCaseDetails(caseData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const checkAssessmentExists = async () => {
      try {
        const response = await fetch(`http://localhost:5000/bail-assessment/check/${caseId}`, {
          method: "GET",
          headers: { "x-api-key": API_KEY },
        });

        if (!response.ok) throw new Error("Failed to check assessment status");

        const result = await response.json();
        setAssessmentExists(result.exists);
      } catch (err) {
        console.error("❌ Error checking assessment:", err);
        // Fallback: show the button even if error in check
        setAssessmentExists(false);
      }
    };

    fetchCaseDetails();
    checkAssessmentExists();
  }, [caseId]);

  if (loading) {
    return <div className="loading-message">Loading case details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!caseDetails) {
    return <div className="error-message">No case details available.</div>;
  }

  return (
    <div className="case-details-container">
      <div className="case-box">
        <h2 className="case-title">Case Details</h2>

        <div className="case-table">
          <div><strong>Case Number:</strong></div>
          <div>{caseDetails.case_number || "N/A"}</div>

          <div><strong>Client Name:</strong></div>
          <div>{caseDetails.client_name || "N/A"}</div>

          <div><strong>Crime:</strong></div>
          <div>{caseDetails.crime || "N/A"}</div>

          <div><strong>Lawyer ID:</strong></div>
          <div>{caseDetails.lawyer_id || "N/A"}</div>

          <div><strong>Hearing Dates:</strong></div>
          <div>{caseDetails.hearing_dates?.join(", ") || "No hearing dates available"}</div>

          <div><strong>Status:</strong></div>
          <div>{caseDetails.status || "Unknown"}</div>

          <div><strong>Details:</strong></div>
          <div>{caseDetails.details || "No additional details provided."}</div>
        </div>

        {/* ✅ Only show this button if assessment doesn't exist */}
        {!assessmentExists && (
          <button 
            className="proceed-button" 
            onClick={() => navigate(`/MCQ/${caseId}`)}
          >
            Proceed to Bail Assessment
          </button>
        )}
      </div>
    </div>
  );
};

export default CaseDetails;
