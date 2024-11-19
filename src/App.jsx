import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Feed from "./components/Feed";
// import Profile from "./components/Profile";
// import MyDrops from "./components/MyDrops";
// import Settings from "./components/Settings";
import PostDetails from "./components/PostDetails";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loading screen while checking authentication
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar />}
        <Routes>
          <Route
            path="/"
            element={user ? <Feed /> : <Navigate to="/login" />} // Redirect unauthenticated users
          />
          {/* <Route path="/profile" element={<Profile />} /> */}
          {/* <Route path="/my-drops" element={<MyDrops />} /> */}
          {/* <Route path="/settings" element={<Settings />} /> */}
          <Route
            path="/post/:postId"
            element={user ? <PostDetails /> : <Navigate to="/login" />} // Protect post details
          />
          <Route
            path="/login"
            element={!user ? <Login /> : <Navigate to="/" />} // Redirect authenticated users to Feed
          />
          <Route
            path="/signup"
            element={!user ? <Signup /> : <Navigate to="/" />} // Redirect authenticated users to Feed
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;