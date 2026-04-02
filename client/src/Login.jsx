import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "./assets/logo.png";
import prisoner from "./assets/prisoner.png";
import lawyer from "./assets/lawyer.png";
import judge from "./assets/judge.png";
import police from "./assets/police.png";

const Login = () => {
    const [isReady, setIsReady] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = window.setTimeout(() => setIsReady(true), 120);
        return () => window.clearTimeout(timer);
    }, []);

    const loginRoles = [
        { label: "Prisoner", image: prisoner, route: "/PrisonerLogin" },
        { label: "Lawyer", image: lawyer, route: "/LawyerLogin" },
        { label: "Judge", image: judge, route: "/JudgeLogin" },
        { label: "Police", image: police, route: "/PoliceLogin" },
    ];

    return (
        <main className="login-shell">
            <div className="login-bg" aria-hidden="true" />
            <section className={`hero-panel ${isReady ? "is-ready" : ""}`}>
                <img src={logo} alt="Bail Reckoner Logo" className="brand-logo" />
                <h1 className="brand-title">Bail Reckoner</h1>
                <p className="brand-copy">
                    Choose your role to continue into the judicial workspace.
                </p>
            </section>

            <section className={`login-panel ${isReady ? "is-ready" : ""}`}>
                <h2 className="panel-title">Secure Entry</h2>
                <p className="panel-subtitle">Select your access profile</p>

                <div className="role-grid">
                    {loginRoles.map((role) => (
                        <button
                            key={role.label}
                            className="role-card"
                            onClick={() => navigate(role.route)}
                            type="button"
                        >
                            <img src={role.image} alt={role.label} className="role-icon" />
                            <span className="role-name">{role.label}</span>
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default Login;