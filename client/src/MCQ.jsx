import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./MCQ.css";

const MCQ = () => {
  const { caseId } = useParams();
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [assessmentExists, setAssessmentExists] = useState(false);

  const questions = [
    { id: "Nature_of_Offense", text: "Nature of the Offense", options: ["Low", "Medium", "High"] },
    { id: "Flight_Risk", text: "Flight Risk", options: ["No", "Yes"] },
    { id: "Criminal_History", text: "Criminal History", options: ["0", "1", "2+"] },
    { id: "Danger_to_Public", text: "Danger to Public", options: ["No", "Yes"] },
    { id: "Likelihood_of_Crime", text: "Likelihood of Committing Another Crime", options: ["Low", "Medium", "High"] },
    { id: "Evidence_Strength", text: "Strength of Evidence", options: ["Low", "Medium", "High"] },
    { id: "Community_Ties", text: "Community Ties", options: ["No", "Yes"] },
    { id: "Substance_Abuse", text: "Substance Abuse Issues", options: ["No", "Yes"] },
    { id: "Bail_Conditions", text: "Ability to Meet Bail Conditions", options: ["Low", "Medium", "High"] },
  ];

  const optionToValue = {
    No: 0,
    Yes: 1,
    Low: 0,
    Medium: 1,
    High: 2,
    "Low_Evidence": 1,
    "Medium_Evidence": 2,
    "High_Evidence": 3,
    "0": 0,
    "1": 1,
    "2+": 2,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isEvidence = name === "Evidence_Strength";
    const mappedValue = isEvidence ? optionToValue[`${value}_Evidence`] : optionToValue[value];
    setResponses((prev) => ({
      ...prev,
      [name]: mappedValue,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length !== questions.length) {
      setMessage("Please answer all questions before submitting.");
      return;
    }

    const assessmentArray = questions.map((q) => responses[q.id]);

    try {
      const response = await fetch("http://localhost:5000/bail-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "mysecureapikey123",
        },
        body: JSON.stringify({
          caseNumber: caseId,
          assessment: assessmentArray,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Submission failed");
      }

      setSubmitted(true);
      setMessage("Bail assessment submitted successfully.");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Check if assessment already exists
  useEffect(() => {
    const checkAssessment = async () => {
      try {
        const res = await fetch(`http://localhost:5000/check-bail-assessment/${caseId}`, {
          headers: { "x-api-key": "mysecureapikey123" },
        });
        const result = await res.json();
        if (result.exists) {
          setAssessmentExists(true);
          setMessage("Bail assessment already submitted.");
        }
      } catch (error) {
        console.error("Error checking assessment:", error);
      }
    };

    checkAssessment();
  }, [caseId]);

  return (
    <div className="prisoner-details-container">
      <div className="details-box">
        <h3>Bail Assessment Form</h3>
        {assessmentExists ? (
          <p style={{ color: "orange", fontWeight: "bold" }}>{message}</p>
        ) : (
          <form className="bail-factor-form">
            {questions.map((q) => (
              <label key={q.id}>
                {q.text}
                <select name={q.id} onChange={handleChange} defaultValue="">
                  <option value="" disabled>
                    -- Select an option --
                  </option>
                  {q.options.map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button type="button" onClick={handleSubmit} disabled={submitted}>
              {submitted ? "Submitted" : "Submit"}
            </button>
          </form>
        )}
        {message && !assessmentExists && (
          <p style={{ marginTop: "15px", color: submitted ? "#00ff99" : "#ff4d4d" }}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default MCQ;
