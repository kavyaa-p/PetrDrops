import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Post from "./Post";
import "./PostList.css";

const PostList = () => {
    const [posts, setPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("created_at"); // Default sort by created_at
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        setLoading(true);

        try {
            // Construct the query
            const { data: postsData, error: postsError } = await supabase
                .from("Post")
                .select(`
                    *,
                    (SELECT COUNT(*) FROM Likes WHERE Likes.post_id = Post.id) AS likes
                `)
                .order(sortOption === "likes" ? "likes" : "created_at", {
                    ascending: sortOption === "created_at", // Ascending for created_at, descending for likes
                });

            if (postsError) throw postsError;

            // Filter posts by search term
            const filteredPosts = postsData.filter((post) =>
                searchTerm ? post.title.toLowerCase().includes(searchTerm.toLowerCase()) : true
            );

            setPosts(filteredPosts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [searchTerm, sortOption]);

    return (
        <div className="post-list-container">
            {/* Search and Sort Controls */}
            <div className="post-list-controls">
                <input
                    type="text"
                    placeholder="Search posts by title"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="sort-select"
                >
                    <option value="created_at">Sort by Created Time</option>
                    <option value="likes">Sort by Likes</option>
                </select>
            </div>

            {loading ? (
                <p>Loading posts...</p>
            ) : (
                <div className="post-list">
                    {posts.length > 0 ? (
                        posts.map((post) => <Post key={post.id} postData={post} />)
                    ) : (
                        <p>No posts found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostList;