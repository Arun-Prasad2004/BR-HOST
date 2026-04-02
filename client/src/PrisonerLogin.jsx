import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import prisoner from "./assets/Prisoner.png";
import "./PrisonerLogin.css";

const PrisonerLogin = () => {
  const [prisonerId, setPrisonerId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();   

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await fetch(`http://localhost:5000/Prisoner/${prisonerId}`, {
        method: "GET",
        headers: { "x-api-key": "mysecureapikey123" }, 
      });

      if (!response.ok) {
        throw new Error("Prisoner not found");
      }

      const prisonerData = await response.json();
      console.log("✅ Prisoner Found:", prisonerData);

      // ✅ Redirect to the result page with prisoner data
      navigate("/PrisonerDetails", { state: { prisoner: prisonerData } });

    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="prisoner-login-container">
      <h2 className="login-title">PRISONER LOGIN</h2>
      <div className="login-box">
        <img src={prisoner} alt="Prisoner" className="login-img" />
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter Prisoner ID"
            value={prisonerId}
            onChange={(e) => setPrisonerId(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default PrisonerLogin;
