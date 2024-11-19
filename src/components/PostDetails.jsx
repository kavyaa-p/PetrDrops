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

    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedContent, setEditedContent] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: userData } = await supabase.auth.getUser();
                if (userData) {
                    setUserId(userData.user?.id);
                }

                const { data: postData, error: postError } = await supabase
                    .from("Post")
                    .select("*, Users(username, profile_pic), Media(media_url)")
                    .eq("id", postId)
                    .single();

                if (postError) throw postError;

                setPost(postData);
                setUsername(postData.Users?.username || "Unknown User");
                setProfilePic(postData.Users?.profile_pic || "https://via.placeholder.com/40");

                setEditedTitle(postData.title);
                setEditedContent(postData.content);

                const { data: commentsData, error: commentsError } = await supabase
                    .from("Comments")
                    .select("*, Users(username, profile_pic)")
                    .eq("post_id", postId)
                    .order("created_at", { ascending: true });

                if (commentsError) throw commentsError;

                setComments(commentsData || []);

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
    }, [postId]);

    useEffect(() => {
        const commentSubscription = supabase
            .channel("realtime-comments")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "Comments" },
                async (payload) => {
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
            supabase.removeChannel(commentSubscription);
        };
    }, [postId]);

    useEffect(() => {
        const postSubscription = supabase
            .channel("realtime-posts")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "Post", filter: `id=eq.${postId}` },
                async (payload) => {
                    setPost((prevPost) => ({
                        ...prevPost,
                        title: payload.new.title,
                        content: payload.new.content,
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(postSubscription);
        };
    }, [postId]);

    const handleEdit = async (e) => {
        e.stopPropagation();

        try {
            const { error } = await supabase
                .from("Post")
                .update({ title: editedTitle, content: editedContent })
                .eq("id", postId);

            if (error) throw error;

            alert("Post updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating post:", error);
            alert("Failed to update the post.");
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        const confirmDelete = window.confirm("Are you sure you want to delete this post?");
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from("Post")
                .delete()
                .eq("id", postId);

            if (error) throw error;

            alert("Post deleted successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete the post.");
        }
    };

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

        setNewComment("");
    };

    if (!post) {
        return <div>Loading post...</div>;
    }

    return (
        <div className="post-details-container">
            <div className="post-header">
                <img src={profilePic} alt="Profile" className="profile-pic" />
                <div className="username-time-container">
                    <p className="username">{username}</p>
                    <p className="post-time">{new Date(post.created_at).toLocaleString()}</p>
                </div>
            </div>

            <div className="post-content">
                {isEditing ? (
                    <>
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            placeholder="Edit title"
                            className="edit-input"
                        />
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            placeholder="Edit content"
                            className="edit-textarea"
                        />
                        <button onClick={handleEdit} className="save-button">
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <h3>{post.title}</h3>
                        <p>{post.content}</p>
                        {post.Media?.media_url && (
                            <img src={post.Media.media_url} alt="Post media" className="post-media" />
                        )}
                    </>
                )}
            </div>

            <div className="post-actions">
                {!isEditing && (
                    <>
                        <button onClick={() => setIsEditing(true)} className="edit-button">
                            Edit
                        </button>
                        <button onClick={handleDelete} className="delete-button">
                            Delete
                        </button>
                    </>
                )}
            </div>

            <div className="likes-comments-header">
                <p>{likes} likes</p>
                <h4>Comments</h4>
            </div>

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