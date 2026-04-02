import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./JudgeCases.css";

const JudgeCases = () => {
  const { state } = useLocation();
  const { judge } = state || {};
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    if (judge?.cases_assigned?.length > 0) {
      const fetchCases = async () => {
        try {
          const caseData = await Promise.all(
            judge.cases_assigned.map((caseId) =>
              fetch(`http://localhost:5000/cases/${caseId}`, {
                method: "GET",
                headers: {
                  "x-api-key": "mysecureapikey123",
                  "Content-Type": "application/json",
                },
              }).then((res) => res.json())
            )
          );

          const validCases = caseData.filter((item) => !item.message);
          setCases(validCases);
          setFilteredCases(validCases);
        } catch (error) {
          console.error("Error fetching case details:", error);
        }
      };

      fetchCases();
    }
  }, [judge]);

  useEffect(() => {
    let result = cases;

    if (searchQuery.trim()) {
      result = result.filter(
        (item) =>
          item.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.crime.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((item) => item.status === statusFilter);
    }

    setFilteredCases(result);
  }, [searchQuery, statusFilter, cases]);

  const handleCaseClick = (caseId) => {
    navigate(`/JCaseDetails/${caseId}`);
  };

  const caseStats = {
    total: cases.length,
    pending: cases.filter((c) => c.status?.includes("Pending")).length,
    verdictGiven: cases.filter((c) => c.status?.includes("Verdict")).length,
    ongoing: cases.filter((c) => c.status?.includes("Ongoing")).length,
  };

  return (
    <div className="judge-dashboard">
      <div className="judge-info-card">
        <h2>👨‍⚖️ Judge {judge?.name} - {judge?.court}</h2>
        <p>Experience: {judge?.experience} years</p>
        <p>Email: {judge?.email}</p>
        <p>Phone: {judge?.phone}</p>
      </div>

      <div className="dashboard-controls">
        <input
          type="text"
          placeholder="Search by case number, client name, or crime"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-bar"
        />

        <select
          className="filter-dropdown"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Trial Ongoing">Trial Ongoing</option>
          <option value="Verdict Given">Verdict Given</option>
          <option value="Charges Filed">Charges Filed</option>
          <option value="Under Investigation">Under Investigation</option>
        </select>
      </div>

      <div className="case-stats">
        <span>Total Cases: {caseStats.total}</span>
        <span>Pending: {caseStats.pending}</span>
        <span>Ongoing: {caseStats.ongoing}</span>
        <span>Verdicts: {caseStats.verdictGiven}</span>
      </div>

      {filteredCases.length > 0 ? (
        <div className="cases-grid">
          {filteredCases.map((caseData, index) => (
            <div key={index} className="case-card">
              <div className="case-content">
                <h3>📁 {caseData.case_number}</h3>
                <p><strong>Client:</strong> {caseData.client_name}</p>
                <p><strong>Crime:</strong> {caseData.crime}</p>
                <p><strong>Status:</strong> <span className={`status-tag ${caseData.status.replace(/\s/g, "-").toLowerCase()}`}>{caseData.status}</span></p>
                {caseData.hearing_dates && (
                  <p><strong>Next Hearing:</strong> {caseData.hearing_dates[0]}</p>
                )}
                <button
                  onClick={() => handleCaseClick(caseData._id)}
                  className="case-button"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-text">No matching cases found.</p>
      )}
    </div>
  );
};

export default JudgeCases;

