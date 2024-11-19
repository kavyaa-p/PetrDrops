import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [profilePic, setProfilePic] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Step 1: Sign up the user
        const { data: signupData, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error("Signup failed:", error.message);
            alert("Signup failed! Please try again.");
            setLoading(false);
            return;
        }

        const user = signupData?.user;

        // Step 2: Insert additional user data into the Users table
        if (user) {
            const { error: profileError } = await supabase
                .from("Users")
                .insert([
                    {
                        id: user.id, // Use the auto-generated user ID from Supabase Auth
                        username,
                        email,
                        profile_pic: profilePic || null,
                        password, // This is just an example, avoid saving plaintext passwords in production
                    },
                ]);

            if (profileError) {
                console.error("Error saving user profile:", profileError.message);
                alert("Error saving user profile. Please contact support.");
            } else {
                alert("Signup successful! Please verify your email before logging in.");
                navigate("/login"); // Redirect to login page
            }
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSignup}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
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
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePic(e.target.files[0]?.name)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Signing up..." : "Sign Up"}
                </button>
            </form>
            <p>
                Already have an account?{" "}
                <span onClick={() => navigate("/login")} className="link">
                    Login
                </span>
            </p>
        </div>
    );
};

export default Signup;