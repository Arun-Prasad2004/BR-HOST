import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JCaseDetails.css";

const CaseDetails = () => {
  const { caseId } = useParams(); // this is actually case_number
  const [caseDetails, setCaseDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State for managing the editing UI and data
  const [isEditing, setIsEditing] = useState(false);
  const [editableDetails, setEditableDetails] = useState(null);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      // Clear previous state on re-fetch
      setError(null);
      setLoading(true);

      try {
        const response = await fetch(`http://localhost:5000/cases/${caseId}`, {
          method: "GET",
          headers: { "x-api-key": "mysecureapikey123" },
        });

        if (!response.ok) {
          throw new Error("Case not found");
        }

        const caseData = await response.json();
        setCaseDetails(caseData);
        // Initialize the editable form data when data is fetched
        setEditableDetails({
          ...caseData,
          hearing_dates: caseData.hearing_dates?.join(", ") || "",
        });

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [caseId]);

  // Handles changes in any input field during editing
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  // Handles submitting the updated details to the server
  const handleUpdate = async (e) => {
    e.preventDefault(); // Prevent form from reloading the page
    setError(null); // Clear previous errors

    // Prepare data to be sent, converting the date string back to an array
    const dataToSend = {
      ...editableDetails,
      hearing_dates: editableDetails.hearing_dates
        .split(',')
        .map(date => date.trim())
        .filter(Boolean), // filter(Boolean) removes empty strings
    };

    try {
      const response = await fetch(`http://localhost:5000/cases/${caseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "mysecureapikey123",
        },
        body: JSON.stringify(dataToSend),
      });

      const contentType = response.headers.get("content-type");
      // Handle server errors that return HTML instead of JSON
      if (!response.ok) {
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } else {
          // This is the key part for diagnosing the "Unexpected token '<'" error
          throw new Error(`Server returned a non-JSON response. Status: ${response.status}. Check backend logs.`);
        }
      }

      const updatedData = await response.json();
      setCaseDetails(updatedData); // Update the main display with fresh data
      setIsEditing(false); // Exit editing mode on success

    } catch (error) {
      setError(error.message); // Display the error message to the user
    }
  };

  // Resets form changes and exits editing mode
  const handleCancel = () => {
    // Reset editable state back to the original case details
    setEditableDetails({
      ...caseDetails,
      hearing_dates: caseDetails.hearing_dates?.join(", ") || "",
    });
    setIsEditing(false);
    setError(null); // Clear any errors shown during edit attempt
  };

  // Handles the original bail risk check
  const handleCheckRisk = async () => {
    if (!caseDetails || !caseDetails.bail_assessment) {
      setError("No bail assessment factors available.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5002/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_number: caseDetails.case_number }),
      });

      const predictionData = await response.json();

      if (!response.ok) {
        throw new Error(predictionData.error || "Prediction failed.");
      }

      navigate(`/Judgeresult/${caseDetails.case_number}`, { state: { predictionData } });
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  // If there's an error and no case details could be loaded, show only the error.
  if (!caseDetails && error) return <div>{error}</div>;

  return (
    <div className="prisoner-details-container">
      <div className="details-box">
        <h2 className="details-title">Case Details</h2>
        {/* Display any error messages prominently */}
        {error && <div className="error-message">{error}</div>}

        {isEditing ? (
          // --- EDITING MODE ---
          <form onSubmit={handleUpdate} className="details-form">
            <div className="details-table">
              <div><strong>Case Number:</strong></div>
              <div>{editableDetails.case_number}</div>

              <div><label htmlFor="client_name"><strong>Client Name:</strong></label></div>
              <div>
                <input type="text" id="client_name" name="client_name" value={editableDetails.client_name} onChange={handleInputChange} />
              </div>

              <div><label htmlFor="crime"><strong>Crime:</strong></label></div>
              <div>
                <input type="text" id="crime" name="crime" value={editableDetails.crime} onChange={handleInputChange} />
              </div>

              <div><strong>Lawyer ID:</strong></div>
              <div>{editableDetails.lawyer_id}</div>

              <div><label htmlFor="hearing_dates"><strong>Hearing Dates (comma-separated):</strong></label></div>
              <div>
                <input type="text" id="hearing_dates" name="hearing_dates" value={editableDetails.hearing_dates} onChange={handleInputChange} placeholder="e.g., 2025-09-15, 2025-10-20" />
              </div>

              <div><label htmlFor="status"><strong>Status:</strong></label></div>
              <div>
                <input type="text" id="status" name="status" value={editableDetails.status} onChange={handleInputChange} />
              </div>

              <div><label htmlFor="details"><strong>Details:</strong></label></div>
              <div>
                <textarea id="details" name="details" value={editableDetails.details} onChange={handleInputChange} rows="4" />
              </div>
            </div>
            <div className="button-group">
                <button type="submit" className="save-button">Save Changes</button>
                <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        ) : (
          // --- VIEW MODE ---
          <>
            {caseDetails && (
              <div className="details-table">
                <div><strong>Case Number:</strong></div>
                <div>{caseDetails.case_number}</div>

                <div><strong>Client Name:</strong></div>
                <div>{caseDetails.client_name}</div>

                <div><strong>Crime:</strong></div>
                <div>{caseDetails.crime}</div>

                <div><strong>Lawyer ID:</strong></div>
                <div>{caseDetails.lawyer_id}</div>

                <div><strong>Hearing Dates:</strong></div>
                <div>{caseDetails.hearing_dates?.join(", ") || "N/A"}</div>

                <div><strong>Status:</strong></div>
                <div>{caseDetails.status}</div>

                <div><strong>Details:</strong></div>
                <div>{caseDetails.details}</div>
              </div>
            )}
            <div className="button-group">
                <button className="edit-button" onClick={() => setIsEditing(true)}>Update Details</button>
                <button className="check-button" onClick={handleCheckRisk}>Check Bail Risk</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CaseDetails;