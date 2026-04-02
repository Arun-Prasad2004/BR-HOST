import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PoliceLogin.css";
import police from "./assets/Police.png";

const PoliceLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = () => {
        if (username.trim() === "" || password.trim() === "") {
            alert("Please enter both Username and Password");
            return;
        }
        console.log("Redirecting to Police Dashboard...");
        navigate("/police-dashboard");
    };

    return (
        <div className="police-login-container">
            <h1 className="login-title">POLICE LOGIN</h1>
            <img src={police} alt="Police" className="login-img" />
            <div className="login-box">
                <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={handleLogin}>Login</button>
            </div>
        </div>
    );
};

export default PoliceLogin;
