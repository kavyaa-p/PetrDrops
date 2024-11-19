import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Post.css";

const Post = ({ postData }) => {
    const [likes, setLikes] = useState(0); // Start with 0, fetch real count later
    const [liked, setLiked] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(postData.title);
    const [editedContent, setEditedContent] = useState(postData.content);
    const [username, setUsername] = useState("Unknown User"); // Username state
    const [profilePic, setProfilePic] = useState(null); // Profile picture state
    const [mediaUrl, setMediaUrl] = useState(null); // Media URL state
    const [mediaType, setMediaType] = useState(null); // Media type state

    const navigate = useNavigate(); // For navigation

    // Fetch user and media details
    const fetchPostDetails = async () => {
        try {
            // Fetch user details
            const { data: userData, error: userError } = await supabase
                .from("Users")
                .select("username, profile_pic")
                .eq("id", postData.user_id)
                .single();

            if (userError) throw userError;

            setUsername(userData?.username || "Unknown User");
            setProfilePic(userData?.profile_pic || "https://via.placeholder.com/40");

            // Fetch media details if media_id is present
            if (postData.media_id) {
                const { data: mediaData, error: mediaError } = await supabase
                    .from("Media")
                    .select("media_url, media_type")
                    .eq("id", postData.media_id)
                    .single();

                if (mediaError) throw mediaError;

                setMediaUrl(mediaData?.media_url || null);
                setMediaType(mediaData?.media_type || null);
            }
        } catch (error) {
            console.error("Error fetching post details:", error);
        }
    };

    // Fetch likes count dynamically
    const fetchLikes = async () => {
        try {
            const { count, error } = await supabase
                .from("Likes")
                .select("id", { count: "exact" })
                .eq("post_id", postData.id);

            if (error) throw error;

            setLikes(count || 0);
        } catch (error) {
            console.error("Error fetching likes count:", error);
        }
    };

    useEffect(() => {
        fetchLikes();
        fetchPostDetails(); // Fetch user and media details
    }, [postData.id, postData.user_id, postData.media_id]); // Re-run when post ID, user ID, or media ID changes

    // Handle like action
    const handleLike = async (e) => {
        e.stopPropagation(); // Prevent navigation when liking

        if (liked) return; // Prevent multiple likes
        setLiked(true); // Optimistic UI update

        try {
            const { error } = await supabase
                .from("Likes")
                .insert([{ user_id: postData.user_id, post_id: postData.id }]);

            if (error) throw error;

            // Fetch updated likes count from the backend
            fetchLikes();
        } catch (error) {
            console.error("Error liking the post:", error);
            alert("Failed to like the post.");
            setLiked(false); // Rollback if error
        }
    };

    // Handle post edit
    const handleEdit = async (e) => {
        e.stopPropagation(); // Prevent navigation

        try {
            const { error } = await supabase
                .from("Post")
                .update({ title: editedTitle, content: editedContent })
                .eq("id", postData.id);

            if (error) throw error;

            alert("Post updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating post:", error);
            alert("Failed to update the post.");
        }
    };

    // Handle post delete
    const handleDelete = async (e) => {
        e.stopPropagation(); // Prevent navigation
        const confirmDelete = window.confirm("Are you sure you want to delete this post?");
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from("Post")
                .delete()
                .eq("id", postData.id);

            if (error) throw error;

            alert("Post deleted successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete the post.");
        }
    };

    // Redirect to detailed post page
    const handlePostClick = () => {
        navigate(`/post/${postData.id}`);
    };

    return (
        <div className="post-container" onClick={handlePostClick}>
            <div className="post-header">
                <img src={profilePic} alt="Profile" className="profile-pic" />
                <div className="username-time-container">
                    <p className="username">{username}</p>
                    <p className="post-time">{new Date(postData.created_at).toLocaleString()}</p>
                </div>
            </div>

            <div className="post-content">
                {isEditing ? (
                    <>
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => {
                                e.stopPropagation();
                                setEditedTitle(e.target.value);
                            }}
                            placeholder="Edit title"
                            className="edit-input"
                        />
                        <textarea
                            value={editedContent}
                            onChange={(e) => {
                                e.stopPropagation();
                                setEditedContent(e.target.value);
                            }}
                            placeholder="Edit content"
                            className="edit-textarea"
                        />
                        <button onClick={handleEdit} className="save-button">
                            Save
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(false);
                            }}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <h3>{postData.title}</h3>
                        <p>{postData.content}</p>
                        {mediaUrl && (
                            mediaType?.startsWith("image/") ? (
                                <img src={mediaUrl} alt="Post media" className="post-media" />
                            ) : mediaType?.startsWith("video/") ? (
                                <video src={mediaUrl} controls className="post-media"></video>
                            ) : (
                                <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                                    View Attachment
                                </a>
                            )
                        )}
                    </>
                )}
            </div>

            <div className="post-actions">
                <div className="action-button" onClick={handleLike}>
                    {liked ? (
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="red"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M11.9999 3.94228C13.1757 2.85872 14.7069 2.25 16.3053 2.25C18.0313 2.25 
                            19.679 2.95977 20.8854 4.21074C22.0832 5.45181 22.75 7.1248 22.75 8.86222C22.75 
                            10.5997 22.0831 12.2728 20.8854 13.5137C20.089 14.3393 19.2938 15.1836 18.4945 
                            16.0323C16.871 17.7562 15.2301 19.4985 13.5256 21.14L13.5216 21.1438C12.6426 21.9779 
                            11.2505 21.9476 10.409 21.0754L3.11399 13.5136C0.62867 10.9374 0.62867 6.78707 3.11399 
                            4.21085C5.54605 1.68984 9.46239 1.60032 11.9999 3.94228Z" />
                        </svg>
                    ) : (
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            border="black"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M22 8.86222C22 10.4087 21.4062 11.8941 20.3458 12.9929C17.9049 15.523 
                            15.5374 18.1613 13.0053 20.5997C12.4249 21.1505 11.5042 21.1304 10.9488 20.5547L3.65376 
                            12.9929C1.44875 10.7072 1.44875 7.01723 3.65376 4.73157C5.88044 2.42345 9.50794 2.42345 
                            11.7346 4.73157L11.9998 5.00642L12.2648 4.73173C13.3324 3.6245 14.7864 3 16.3053 3C17.8242 
                            3 19.2781 3.62444 20.3458 4.73157C21.4063 5.83045 22 7.31577 22 8.86222Z" />
                        </svg>
                    )}
                    <span>{likes}</span>
                </div>

                <button className="edit-button" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                    Edit
                </button>

                <button className="delete-button" onClick={handleDelete}>
                    Delete
                </button>
            </div>
        </div>
    );
};

export default Post;