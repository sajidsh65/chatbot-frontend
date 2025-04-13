import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("https://chatbot-bysajid-3685.up.railway.app/api/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            // console.log("🔹 Backend Response:", data);

            if (data.token) {
                localStorage.setItem("token", data.access || data.token || data.auth_token);
                onLogin();
                navigate("/"); // Redirect to main page after login
            } else {
                setError("Invalid username or password!");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Something went wrong. Try again!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-box">
            <h2>Login</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
            
            {/* Register Button */}
            <p className="register-link">
                Don't have an account?{" "}
                <button onClick={() => navigate("/register")} className="register-btn">
                    Register
                </button>
            </p>
        </div>
    );
};

export default Login;
