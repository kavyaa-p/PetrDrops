import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import CheckboxToggle from "./CheckboxToggle";
import "./NewPost.css";

const NewPost = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [media, setMedia] = useState(null);
    const [flag, setFlag] = useState("Post");
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);

    // Fetch the current user ID on mount
    useEffect(() => {
        const fetchUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (data) setUserId(data.user?.id);
        };

        fetchUser();
    }, []);

    const handleMediaChange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert("No file selected!");
            return;
        }

        // Sanitize the file name
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${Date.now()}-${sanitizedFileName}`; // Ensure unique file name

        try {
            console.log("Uploading file to bucket...");

            // Upload file to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("media-uploads") // Ensure this matches your bucket name
                .upload(fileName, file);

            if (uploadError) {
                console.error("Upload error:", uploadError);
                alert("Error uploading media! Check if the bucket exists and has the right permissions.");
                return;
            }

            console.log("Upload successful:", uploadData);

            // Use the full file path from the upload response
            const fullPath = uploadData.path;

            // Generate public URL for the uploaded media
            const { data: publicUrlData, error: publicUrlError } = supabase.storage
                .from("media-uploads")
                .getPublicUrl(fullPath); // Use the correct path

            if (publicUrlError || !publicUrlData?.publicUrl) {
                console.error("Error generating public URL:", publicUrlError);
                alert("Error generating public URL! Check bucket permissions.");
                return;
            }

            console.log("Public URL generated:", publicUrlData.publicUrl);

            // Store media information in state
            setMedia({
                path: fullPath, // Path in storage
                url: publicUrlData.publicUrl, // Public URL for the file
                type: file.type, // MIME type of the file
            });
        } catch (error) {
            console.error("Unexpected error during media upload:", error);
            alert("Unexpected error occurred during file upload!");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title) {
            alert("Title is required!");
            return;
        }

        setLoading(true);

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
            alert("User not authenticated. Please log in.");
            setLoading(false);
            return;
        }

        let mediaId = null;

        if (media && media.url) {
            const { data: mediaData, error: mediaInsertError } = await supabase
                .from("Media")
                .insert([
                    {
                        media_url: media.url, // Use the public URL
                        media_type: media.type, // Use the explicit type saved in state
                    },
                ])
                .select();

            if (mediaInsertError) throw mediaInsertError;

            mediaId = mediaData[0].id;
        } else if (media) {
            console.error("Media URL is invalid:", media);
            alert("Failed to attach media to the post!");
        }

        try {
            // Insert post record into the Post table
            const { data: postData, error: postError } = await supabase
                .from("Post")
                .insert([
                    {
                        user_id: userId, // Pass the logged-in user's ID
                        title,
                        content,
                        media_id: mediaId, // Attach the media ID to the post
                        is_petr_drop: flag === "PetrDrop",
                    },
                ])
                .select();

            if (postError) throw postError;

            alert("Post created successfully!");
            setTitle("");
            setContent("");
            setMedia(null);
            setFlag("Post");
        } catch (postError) {
            console.error("Post creation error:", postError);
            alert("Error creating post!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="new-post-container">
            {/* Title Input */}
            <div className="new-post-input">
                <input
                    type="text"
                    className="post-title-input"
                    placeholder="Title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>

            {/* Content Input */}
            <div className="new-post-input">
                <input
                    type="text"
                    className="post-title-input"
                    placeholder="Share something"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>

            {/* Action Buttons */}
            <div className="new-post-actions">
                {/* Left Actions */}
                <div className="left-actions">
                    <div className="left-actions">
                        {/* Media Button */}
                        <label className="action-icon">
                            <input type="file" accept="*" hidden onChange={handleMediaChange} />
                            <svg
                                width="24px"
                                height="24px"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                color="#000000"
                            >
                                <path
                                    d="M21 3.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H20.4C20.7314 3 21 3.26863 21 3.6Z"
                                    stroke="#000000"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                ></path>
                                <path
                                    d="M3 16L10 13L21 18"
                                    stroke="#000000"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                ></path>
                                <path
                                    d="M16 10C14.8954 10 14 9.10457 14 8C14 6.89543 14.8954 6 16 6C17.1046 6 18 6.89543 18 8C18 9.10457 17.1046 10 16 10Z"
                                    stroke="#000000"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                ></path>
                            </svg>
                            Media
                        </label>

                        {/* Checkbox */}
                        <div className="checkbox-container">
                            <CheckboxToggle
                                checked={flag === "PetrDrop"}
                                onChange={() => setFlag(flag === "Post" ? "PetrDrop" : "Post")}
                            />
                            <span>Petr Drop</span>
                        </div>
                    </div>

                </div>

                {/* Right Actions */}
                <div className="right-actions">
                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="send-button"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewPost;