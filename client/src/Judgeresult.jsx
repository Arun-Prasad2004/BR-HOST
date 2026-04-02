import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Judgeresult.css";

const BailResult = () => {
  const { caseId } = useParams();
  const [riskLevel, setRiskLevel] = useState(null);
  const [factors, setFactors] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBailResult = async () => {
      try {
        const response = await fetch(`http://localhost:5002/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ case_number: caseId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch bail risk");
        }

        setRiskLevel(data.risk_level);
        setFactors(data.factors || []);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchBailResult();
  }, [caseId]);

  const featureNames = [
    "Nature of Offense",
    "Flight Risk",
    "Criminal History",
    "Danger to Public",
    "Likelihood of Crime",
    "Evidence Strength",
    "Community Ties",
    "Substance Abuse",
    "Bail Conditions",
  ];

  const mapValueToLabel = (feature, value) => {
    // Binary: 0 = No, 1 = Yes
    if (["Flight Risk", "Danger to Public", "Community Ties", "Substance Abuse"].includes(feature)) {
      return value === 0 ? "No" : "Yes";
    }
  
    // Ternary: 0 = Low, 1 = Medium, 2 = High
    if (["Nature of Offense", "Likelihood of Crime", "Bail Conditions"].includes(feature)) {
      return value === 0 ? "Low" : value === 1 ? "Medium" : "High";
    }
  
    // Evidence Strength: 1 = Low, 2 = Medium, 3 = High
    if (feature === "Evidence Strength") {
      return value === 1 ? "Low" : value === 2 ? "Medium" : value === 3 ? "High" : value;
    }
  
    // Criminal History: Return as is (assuming it's numeric or textual)
    if (feature === "Criminal History") {
      return value;
    }
  
    // Default: Return value as-is
    return value;
  };
  

  return (

    <div className="judgeresult-container">
      <h1 className="result-heading">
        Bail Risk Prediction Result
      </h1>

      {error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div className={`risk-level-box ${riskLevel?.toLowerCase().replace(" ", "-")}`}>
  <h2>
    Risk Level: <strong>{riskLevel || "Loading..."}</strong>
  </h2>
</div>


          <h3 className="factors-title">Factors Considered:</h3>
          <ul className="factors-list">
            {factors.map((value, index) => (
              <li key={index}>
                <strong>{featureNames[index]}</strong>: {mapValueToLabel(featureNames[index], value)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default BailResult;
