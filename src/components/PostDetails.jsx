import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./PostDetails.css";

const PostDetails = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("Unknown User");
    const [profilePic, setProfilePic] = useState(null);
    const [likes, setLikes] = useState(0);

    // Fetch post details, user info, comments, and likes
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch current user
                const { data: userData } = await supabase.auth.getUser();
                if (userData) {
                    setUserId(userData.user?.id);
                }

                // Fetch post details
                const { data: postData, error: postError } = await supabase
                    .from("Post")
                    .select("*, Users(username, profile_pic), Media(media_url)")
                    .eq("id", postId)
                    .single();

                if (postError) throw postError;

                setPost(postData);
                setUsername(postData.Users?.username || "Unknown User");
                setProfilePic(postData.Users?.profile_pic || "https://via.placeholder.com/40");

                // Fetch comments
                const { data: commentsData, error: commentsError } = await supabase
                    .from("Comments")
                    .select("*, Users(username, profile_pic)")
                    .eq("post_id", postId)
                    .order("created_at", { ascending: true });

                if (commentsError) throw commentsError;

                setComments(commentsData || []);

                // Fetch likes count
                const { count: likeCount, error: likesError } = await supabase
                    .from("Likes")
                    .select("*", { count: "exact" })
                    .eq("post_id", postId);

                if (likesError) throw likesError;

                setLikes(likeCount || 0);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();

        // Real-time comments subscription
        const subscription = supabase
            .channel("realtime-comments")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "Comments" },
                async (payload) => {
                    // Fetch username and profile_pic for the new comment
                    const { data: user, error } = await supabase
                        .from("Users")
                        .select("username, profile_pic")
                        .eq("id", payload.new.user_id)
                        .single();

                    if (error) {
                        console.error("Error fetching user for new comment:", error);
                    }

                    setComments((prev) => [
                        ...prev,
                        {
                            ...payload.new,
                            Users: user || { username: "Anonymous", profile_pic: null },
                        },
                    ]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [postId]);

    // Handle adding comments
    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        if (!userId) {
            alert("User not authenticated. Please log in.");
            return;
        }

        const { data, error } = await supabase
            .from("Comments")
            .insert([{ post_id: postId, content: newComment, user_id: userId }]);

        if (error) {
            console.error("Error adding comment:", error);
            alert("Failed to add comment.");
            return;
        }

        // Clear the input field
        setNewComment("");
    };

    if (!post) {
        return <div>Loading post...</div>;
    }

    return (
        <div className="post-details-container">
            {/* Post Header */}
            <div className="post-header">
                <img src={profilePic} alt="Profile" className="profile-pic" />
                <div className="username-time-container">
                    <p className="username">{username}</p>
                    <p className="post-time">{new Date(post.created_at).toLocaleString()}</p>
                </div>
            </div>

            {/* Post Content */}
            <div className="post-content">
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                {post.Media?.media_url && (
                    <img src={post.Media.media_url} alt="Post media" className="post-media" />
                )}
            </div>

            {/* Likes and Comments Header */}
            <div className="likes-comments-header">
                <p>{likes} likes</p>
                <h4>Comments</h4>
            </div>

            {/* Comments Section */}
            <div className="comments-section">
                {comments.map((comment) => (
                    <div key={comment.id} className="comment">
                        <img
                            src={comment.Users?.profile_pic || "https://via.placeholder.com/40"}
                            alt="Profile"
                            className="profile-pic"
                        />
                        <div className="username-time-container">
                            <p className="username">{comment.Users?.username || "Anonymous"}</p>
                            <p>{comment.content}</p>
                        </div>
                    </div>
                ))}

                {/* Add Comment */}
                <div className="add-comment">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                    />
                    <button onClick={handleAddComment}>Post</button>
                </div>
            </div>
        </div>
    );
};

export default PostDetails;