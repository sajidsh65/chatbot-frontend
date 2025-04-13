import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Chatbot from "./Chatbot";
import Login from "./login";
import Register from "./register";
import "./App.css";

function Home({ isLoggedIn, handleLogout }) {
    const navigate = useNavigate();

    return (
        <div className="App">
            {!isLoggedIn ? (
                <button onClick={() => navigate("/login")} className="login-btn">
                    Login
                </button>
            ) : (
                <button onClick={handleLogout} className="login-btn">
                    Logout
                </button>
            )}
            <Chatbot isLoggedIn={isLoggedIn} />
        </div>
    );
}

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
    };

    return (
        <Routes>
            <Route path="/" element={<Home isLoggedIn={isLoggedIn} handleLogout={handleLogout} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
        </Routes>
    );
}

export default App;
