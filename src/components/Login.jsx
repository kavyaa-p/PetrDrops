import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

import "./Auth.css"; // Optional CSS file for styling

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login failed:", error.message);
            alert("Login failed! Please check your email and password.");
        } else {
            alert("Login successful!");
            navigate("/"); // Redirect to the home/feed page
        }
        setLoading(false);
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                navigate("/"); // Redirect to Feed if already logged in
            }
        };

        checkUser();
    }, []);


    return (
        <div className="auth-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
            <p>
                Don't have an account?{" "}
                <span onClick={() => navigate("/signup")} className="link">
                    Sign up
                </span>
            </p>
        </div>
    );
};

export default Login;