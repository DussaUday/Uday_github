import React, { useEffect, useState } from "react";
import usePost from "../../hooks/usePost";
import { BsHeart, BsChat, BsHeartFill } from "react-icons/bs";

const PostList = () => {
    const { posts, getPosts, likePost, commentPost } = usePost();
    const [comment, setComment] = useState("");
    const [selectedPostId, setSelectedPostId] = useState(null);

    useEffect(() => {
        getPosts();
    }, []);

    const handleLike = async (postId) => {
        await likePost(postId);
    };

    const handleComment = async (postId) => {
        if (!comment) return;
        await commentPost(postId, comment);
        setComment("");
    };

    const toggleCommentPopup = (postId) => {
        setSelectedPostId(selectedPostId === postId ? null : postId);
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Your socialty</h1>
            {posts.map((post) => (
                post.userId && (
                    <div key={post._id} className="mb-8 bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="flex items-center p-4 border-b">
                            <img
                                src={post.userId.profilePic || "https://via.placeholder.com/150"}
                                alt={post.userId.username || "Unknown User"}
                                className="w-12 h-12 rounded-full object-cover mr-3"
                            />
                            <span className="font-bold text-gray-800">{post.userId.username || "Unknown User"}</span>
                        </div>
                        {post.media && (
                            post.media.endsWith('.mp4') || post.media.endsWith('.webm') || post.media.endsWith('.ogg') ? (
                                <video controls className="w-full">
                                    <source src={post.media} type={`video/${post.media.split('.').pop()}`} />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <img src={post.media} alt="Post" className="w-full" />
                            )
                        )}
                        <div className="p-4">
                            <p className="text-gray-700 mb-4">{post.caption}</p>
                            <div className="flex items-center space-x-6">
                                <button
                                    className={`flex items-center focus:outline-none ${
                                        post.likes.includes(localStorage.getItem("userId")) ? "text-red-500" : "text-gray-700"
                                    }`}
                                    onClick={() => handleLike(post._id)}
                                >
                                    {post.likes.includes(localStorage.getItem("userId")) ? (
                                        <BsHeartFill className="w-6 h-6 mr-1" />
                                    ) : (
                                        <BsHeart className="w-6 h-6 mr-1" />
                                    )}
                                    <span>{post.likes.length}</span>
                                </button>
                                <button
                                    className="flex items-center text-gray-700 focus:outline-none"
                                    onClick={() => toggleCommentPopup(post._id)}
                                >
                                    <BsChat className="w-6 h-6 mr-1" />
                                    <span>{post.comments.length}</span>
                                </button>
                            </div>
                        </div>

                        {selectedPostId === post._id && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                                    <h3 className="font-bold text-xl mb-4 text-gray-800">Comments</h3>
                                    <div className="max-h-64 overflow-y-auto">
                                        {post.comments.map((comment, index) => (
                                            <div key={index} className="mt-2">
                                                <span className="font-bold text-gray-800">{comment.userId.username}: </span>
                                                <span className="text-gray-700">{comment.comment}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4">
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Add a comment..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                        <button
                                            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md w-full hover:bg-blue-600 transition-colors"
                                            onClick={() => handleComment(post._id)}
                                        >
                                            Comment
                                        </button>
                                    </div>
                                    <button
                                        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md w-full hover:bg-gray-600 transition-colors"
                                        onClick={() => setSelectedPostId(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            ))}
        </div>
    );
};

export default PostList;