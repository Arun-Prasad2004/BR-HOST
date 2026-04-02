import { useNavigate } from "react-router-dom";
import "./PoliceDashboard.css";

const PoliceDashboard = () => {
  const navigate = useNavigate();

  // Function to handle navigation to the mind map page
  const handleNavigateToMindmap = () => {
    navigate("/mindmap");
  };

  return (
    <div className="police-dashboard">
      <div className="dashboard-header">
        <h1>👮 Police Dashboard</h1>
        <p>Welcome, Officer. Access your tools and investigation resources below.</p>
      </div>

      <div className="dashboard-grid">
        {/* Investigation Mindmap Card */}
        <div 
          className="dashboard-card mindmap-card" 
          onClick={handleNavigateToMindmap}
        >
          <div className="card-icon">🧠</div>
          <h2>Investigation Mindmap</h2>
          <p>Launch the AI-powered tool to visualize case data, connect evidence, and identify patterns in FIRs.</p>
          <span className="card-cta">Open Tool &rarr;</span>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;