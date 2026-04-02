import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import lawyerImage from "./assets/lawyer.png";
import "./LawyerLogin.css";

const LawyerLogin = () => {
  const [lawyerId, setLawyerId] = useState("");
  const [password, setPassword] = useState(""); // State for password
  const [error, setError] = useState("");
  const navigate = useNavigate();   

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    // --- New Validation Step ---
    // Check if the lawyerId and password are the same.
    if (lawyerId && lawyerId === password) {
      // If they match, proceed to fetch lawyer data from the backend.
      try {
        const response = await fetch(`http://localhost:5000/lawyers/${lawyerId}`, {
          method: "GET", // Reverted to GET as password is not sent
          headers: { "x-api-key": "mysecureapikey123" }, 
        });

        if (!response.ok) {
          throw new Error("Lawyer not found on the server");
        }

        const lawyerData = await response.json();
        console.log("✅ Lawyer Found:", lawyerData);

        // Redirect to the result page with lawyer data
        navigate("/Lawyercases", { state: { lawyer: lawyerData } });

      } catch (error) {
        setError(error.message);
      }
    } else {
      // If they don't match, set an error message.
      setError("Incorrect Password.");
    }
  };

  return (
    <div className="lawyer-login-container">
      <h2 className="login-title">LAWYER LOGIN</h2>
      <div className="login-box">
        <img src={lawyerImage} alt="Lawyer" className="login-img" />
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter Lawyer ID"
            value={lawyerId}
            onChange={(e) => setLawyerId(e.target.value)}
          />
        <input
            type="password"
            className="password-input"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
/>
          <button className="login-box button" type="submit">Login</button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default LawyerLogin;