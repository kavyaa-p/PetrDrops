import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Navbar.css";

const Navbar = () => {
    const navigate = useNavigate(); // Import and use navigate here

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
    
            alert("You have been logged out successfully.");
            
            // Add a slight delay to ensure state updates propagate
            setTimeout(() => {
                navigate("/login"); // Redirect to the login page
            }, 100); // Adjust the delay as needed
        } catch (error) {
            console.error("Error during logout:", error);
            alert("Failed to logout. Please try again.");
        }
    };
    

    return (
        <nav className="sidebar">
            <div className="sidebar-brand">
                <Link to="/" className="sidebar-logo">
                    PetrDrops
                </Link>
            </div>
            <ul className="sidebar-nav">
                <li className="sidebar-item">
                    <Link className="sidebar-link" to="/">
                        <span className="icon">📰</span>
                        Feed
                    </Link>
                </li>
                <li className="sidebar-item">
                    <button onClick={handleLogout} className="logout-button">
                        <span className="icon">👤</span>
                        Logout
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;