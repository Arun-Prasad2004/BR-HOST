import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./LawyerCases.css";

const LawyerCases = () => {
  const { state } = useLocation();
  const { lawyer } = state || {};  // Get lawyer object passed from the LawyerLogin component
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (lawyer && lawyer.assigned_cases && lawyer.assigned_cases.length > 0) {
      // Fetch case details based on caseNumbers passed from the previous page
      const fetchCases = async () => {
        try {
          const caseData = await Promise.all(
            lawyer.assigned_cases.map((caseId) =>
              fetch(`http://localhost:5000/cases/${caseId}`, {
                method: "GET",
                headers: { "x-api-key": "mysecureapikey123" },
              }).then((res) => res.json())
            )
          );
          setCases(caseData);
        } catch (error) {
          console.error("Error fetching case details:", error);
        }
      };

      fetchCases();
    }
  }, [lawyer]);

  const handleCaseClick = (caseId) => {
    // Navigate to the case details page using caseNumber
    navigate(`/CaseDetails/${caseId}`);
  };

  return (
    <div className="lawyer-cases-container">
      <h2 className="cases-title">Assigned Cases</h2>
      {lawyer && lawyer.assigned_cases && lawyer.assigned_cases.length > 0 ? (
        <div className="cases-list">
          {cases.map((caseData, index) => (
            <div className="case-item" key={index}>
              <button
                className="case-id-button"
                onClick={() => handleCaseClick(caseData._id)} // Use the case's ObjectId
              >
                Case Number: {caseData.case_number}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No cases assigned to this lawyer.</p>
      )}
    </div>
  );
};

export default LawyerCases;
