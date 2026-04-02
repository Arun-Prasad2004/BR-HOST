import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import judgeImage from "./assets/judge.png";
import "./JudgeLogin.css";

const JudgeLogin = () => {
  const [judgeId, setJudgeId] = useState("");
  const [password, setPassword] = useState(""); // State for password
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous error messages

    // --- New Validation Step ---
    // Check if the judgeId and password are the same.
    if (judgeId && judgeId === password) {
      // If they match, proceed to fetch judge data from the backend.
      try {
        const response = await fetch(`http://localhost:5000/judge/${judgeId}`, {
          method: "GET", // Password is not sent to the backend
          headers: { "x-api-key": "mysecureapikey123" },
        });

        if (!response.ok) {
          throw new Error("Judge not found on the server");
        }

        const judgeData = await response.json();
        console.log("✅ Judge Found:", judgeData);

        // Redirect to the Judge's dashboard page with judge data
        navigate("/JudgeCases", { state: { judge: judgeData } });

      } catch (error) {
        setError(error.message);
      }
    } else {
      // If they don't match, set an error message.
      setError("User ID and Password do not match.");
    }
  };

  return (
    <div className="judge-login-container">
      <h2 className="login-title">JUDGE LOGIN</h2>
      <div className="login-box">
        <img src={judgeImage} alt="Judge" className="login-img" />
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter Judge ID"
            value={judgeId}
            onChange={(e) => setJudgeId(e.target.value)}
          />
          {/* New Password Input Field */}
          <input
            type="password"
            className="password-input"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
/>
          <button className="login-box button"type="submit">Login</button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default JudgeLogin;