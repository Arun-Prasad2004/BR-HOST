import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "./PrisonerDetails.css";

const PrisonerDetails = () => {
  const location = useLocation();
  const prisoner = location.state?.prisoner;
  const [bailResult, setBailResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!prisoner) {
    return <h2 className="error-message">No prisoner details found.</h2>;
  }

  const checkBailEligibility = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5001/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_description: prisoner.case_description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bail eligibility");
      }

      const data = await response.json();
      let formattedResult;
      if (data.bailability === "bailable") {
        formattedResult = "Eligible for Bail";
      } else {
        const description = prisoner.case_description.toLowerCase();
        let days = 60; // Default for most non-bailable offenses with punishment less than 10 years
        if (
          description.includes("murder") ||
          description.includes("rape") ||
          description.includes("gang rape") ||
          description.includes("dowry death") ||
          description.includes("kidnapping for ransom") ||
          description.includes("kidnapping with intent to murder") ||
          description.includes("acid attack") ||
          description.includes("dacoity with murder") ||
          description.includes("armed robbery") ||
          description.includes("dacoity with attempt") ||
          description.includes("hijacking") ||
          description.includes("pocso") ||
          description.includes("human trafficking") ||
          description.includes("cyber terrorism") ||
          description.includes("arms act") ||
          description.includes("waging war") ||
          description.includes("drug trafficking") ||
          description.includes("ndps less")
        ) {
          days = 90;
        } else if (
          description.includes("attempt to murder") ||
          description.includes("culpable homicide") ||
          description.includes("grievous hurt by dangerous weapons") ||
          description.includes("counterfeiting currency") ||
          description.includes("counterfeiting government stamp") ||
          description.includes("forgery") ||
          description.includes("cheating") ||
          description.includes("criminal breach of trust") ||
          description.includes("bank fraud") ||
          description.includes("customs evasion") ||
          description.includes("money laundering") ||
          description.includes("pmla") ||
          description.includes("pc act") ||
          description.includes("breach of privacy") ||
          description.includes("organized smuggling") ||
          description.includes("sabotage essential services") ||
          description.includes("promoting enmity") ||
          description.includes("sedition") ||
          description.includes("illegal arms possession")
        ) {
          days = 60;
        }
        if (
          description.includes("uapa") ||
          description.includes("mcoca") ||
          description.includes("organized crime") ||
          description.includes("unlawful activities") ||
          description.includes("terrorism")
        ) {
          days = 180;
        }
        if (description.includes("ndps")) {
          if (description.includes("commercial")) {
            days = 180;
          } else {
            days = 90;
          }
        }
        formattedResult = `eligible after ${days} days from the date of arrest.`;
      }
      setBailResult(formattedResult);
    } catch (error) {
      console.error("Error checking bail eligibility:", error);
      setError("Failed to fetch bail eligibility. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prisoner-details-container">
      <h2 className="details-title">PRISONER DETAILS</h2>
      <div className="details-box">
        <p><strong>ID:</strong> {prisoner.prisoner_id}</p>
        <p><strong>Name:</strong> {prisoner.name}</p>
        <p><strong>Age:</strong> {prisoner.age}</p>
        <p><strong>Gender:</strong> {prisoner.gender}</p>
        <p><strong>Crime:</strong> {prisoner.crime}</p>
        <p><strong>Case Number:</strong> {prisoner.case_number}</p>
        <p><strong>Prison:</strong> {prisoner.prison}</p>
        <p><strong>Cell:</strong> {prisoner.cell}</p>
        <p><strong>Case Description:</strong> {prisoner.case_description}</p>
        <button className="check-button" onClick={checkBailEligibility} disabled={loading}>
          {loading ? "Checking..." : "Check Bail Eligibility"}
        </button>

        {error && <p className="error-message">{error}</p>}  

        {bailResult && (
          <div className="bail-result">
            <h3>Eligibility Result</h3>
            <p className={`result ${bailResult.includes("Eligible for Bail") ? "bailable" : "nonbailable"}`}>
              {bailResult}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrisonerDetails;