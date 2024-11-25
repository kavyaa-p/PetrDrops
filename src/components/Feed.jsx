import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import NewPost from "./NewPost";
import Post from "./Post";
import "./Feed.css";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("created_at");

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("Post")
        .select("*");

      if (postsError) throw postsError;

      const filteredPosts = postsData.filter((post) =>
        searchTerm ? post.title.toLowerCase().includes(searchTerm.toLowerCase()) : true
      );

      const postsWithLikes = await Promise.all(
        filteredPosts.map(async (post) => {
          const { count: likeCount, error: likesError } = await supabase
            .from("Likes")
            .select("id", { count: "exact" })
            .eq("post_id", post.id);

          if (likesError) {
            console.error(`Error fetching likes for post ${post.id}:`, likesError);
            return { ...post, likes: 0 };
          }

          return { ...post, likes: likeCount || 0 };
        })
      );

      const sortedPosts =
        sortOption === "likes"
          ? postsWithLikes.sort((a, b) => b.likes - a.likes)
          : postsWithLikes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [searchTerm, sortOption]);

  useEffect(() => {
    const subscription = supabase
      .channel("realtime-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Post" },
        (payload) => {
          console.log("New post received via realtime:", payload.new);
          setPosts((prevPosts) => [payload.new, ...prevPosts]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Post" },
        (payload) => {
          console.log("Post updated via realtime:", payload.new);
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === payload.new.id ? payload.new : post
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Likes" },
        (payload) => {
          console.log("New like received via realtime:", payload.new);
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === payload.new.post_id
                ? { ...post, likes: (post.likes || 0) + 1 }
                : post
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="container mt-5">
      <h1>Feed</h1>

      <div className="mt-4 mb-4">
        <input
          type="text"
          placeholder="Search posts by title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control mb-3"
        />

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="form-select"
        >
          <option value="created_at">Sort by Created Time</option>
          <option value="likes">Sort by Likes</option>
        </select>
      </div>

      <div className="mt-4 new-post">
        <NewPost />
      </div>

      <div className="mt-5">
        {posts.length > 0 ? (
          posts.map((post) => <Post key={post.id} postData={post} />)
        ) : (
          <p>No posts found. Try searching or sorting differently!</p>
        )}
      </div>
    </div>
  );
}

export default Feed;