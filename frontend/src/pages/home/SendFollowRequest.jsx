import React, { useState, useEffect, useRef } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { toast } from "react-hot-toast";
import { BsTrash, BsHeart, BsChat } from "react-icons/bs";

const SendFollowRequest = ({ userId, userName, profilePic }) => {
    const { socket } = useSocketContext();
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [hasSentRequest, setHasSentRequest] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);       
    const [comment, setComment] = useState("");
    const modalRef = useRef(null);

    // Fetch follow status
    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                const response = await fetch(`/api/users/${userId}/follow-status`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setIsFollowing(data.isFollowing);
                    setHasSentRequest(data.hasSentRequest);
                } else {
                    toast.error(data.error);
                }
            } catch (error) {
                toast.error("Error checking follow status");
            }
        };

        checkFollowStatus();
    }, [userId]);

    // Fetch user posts if following
    useEffect(() => {
        const fetchUserPosts = async () => {
            if (isFollowing) {
                try {
                    const response = await fetch(`/api/users/${userId}/posts`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    });

                    const data = await response.json();
                    if (response.ok) {
                        setUserPosts(data.posts);
                    } else {
                        toast.error(data.error);
                    }
                } catch (error) {
                    toast.error("Error fetching user posts");
                }
            }
        };

        fetchUserPosts();
    }, [isFollowing, userId]);

    // Handle follow request
    const handleSendFollowRequest = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/follow/${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("sendFollowRequest", { senderId: localStorage.getItem("userId"), receiverId: userId });
                setHasSentRequest(true);
                setIsFollowing(true); // Update the follow status
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error sending follow request");
        } finally {
            setLoading(false);
        }
    };

    // Handle like post
    const handleLike = async (postId) => {
        try {
            const response = await fetch(`/api/posts/like/${postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                setUserPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post._id === postId
                            ? { ...post, likes: data.likes }
                            : post
                    )
                );
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error liking post");
        }
    };

    // Handle comment post
    const handleComment = async (postId) => {
        if (!comment) return;
        try {
            const response = await fetch(`/api/posts/comment/${postId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ comment }),
            });

            const data = await response.json();
            if (response.ok) {
                setUserPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post._id === postId
                            ? { ...post, comments: data.comments }
                            : post
                    )
                );
                setComment("");
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error commenting on post");
        }
    };

    // Handle delete post
    const handleDeletePost = async (postId) => {
        try {
            const response = await fetch(`/api/posts/delete/${postId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                setUserPosts((prevPosts) =>
                    prevPosts.filter((post) => post._id !== postId)
                );
                setSelectedPost(null);
                toast.success(data.message);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error deleting post");
        }
    };

    // Handle click outside modal
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setSelectedPost(null);
            }
        };

        if (selectedPost) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectedPost]);

    return (
        <div className="flex flex-col items-center p-4">
            {/* Profile Picture and Username */}
            <div className="flex flex-col items-center space-y-2">
                <img
                    src={profilePic}
                    alt={userName}
                    className="w-24 h-24 rounded-full object-cover"
                />
                <p className="font-semibold text-gray-800 text-xl">{userName}</p>
                <p className="text-sm text-gray-500">@{userId}</p>
            </div>

            {/* Follow Button */}
            {isFollowing ? (
                <button className="mt-4 px-6 py-2 text-white bg-gray-600 rounded-lg cursor-default">
                    Following
                </button>
            ) : (
                <button
                    onClick={handleSendFollowRequest}
                    disabled={loading || hasSentRequest}
                    className={`mt-4 px-6 py-2 text-white rounded-lg transition duration-150 ${
                        loading || hasSentRequest
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                    }`}
                >
                    {loading ? "Sending..." : hasSentRequest ? "Request Sent" : "Follow"}
                </button>
            )}

            {/* Display User Posts if Following */}
            {isFollowing && (
                <div className="mt-8 w-full">
                    <h2 className="text-2xl font-bold mb-4">{userName}'s Posts</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {userPosts.map((post) => (
                            <div
                                key={post._id}
                                className="cursor-pointer aspect-square overflow-hidden rounded-lg"
                                onClick={() => setSelectedPost(post)}
                            >
                                {post.media.endsWith(".mp4") || post.media.endsWith(".mov") ? (
                                    <video
                                        src={post.media}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={post.media}
                                        alt="Post"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Post Modal */}
                    {selectedPost && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div ref={modalRef} className="bg-white p-4 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center mb-2">
                                    <img
                                        src={selectedPost.userId.profilePic}
                                        alt={selectedPost.userId.username}
                                        className="w-10 h-10 rounded-full mr-2"
                                    />
                                    <span className="font-bold">{selectedPost.userId.username}</span>
                                </div>
                                {selectedPost.media.endsWith(".mp4") || selectedPost.media.endsWith(".mov") ? (
                                    <video
                                        src={selectedPost.media}
                                        controls
                                        className="w-full rounded-lg mb-2"
                                    />
                                ) : (
                                    <img
                                        src={selectedPost.media}
                                        alt="Post"
                                        className="w-full rounded-lg mb-2"
                                    />
                                )}
                                <p className="mb-2">{selectedPost.caption}</p>
                                <div className="flex items-center mb-2">
                                    <button
                                        className={`flex items-center mr-4 ${selectedPost.likes.includes(localStorage.getItem("userId")) ? "text-red-500" : ""}`}
                                        onClick={() => handleLike(selectedPost._id)}
                                    >
                                        <BsHeart className="mr-1" />
                                        {selectedPost.likes.length}
                                    </button>
                                    <button
                                        className="flex items-center"
                                        onClick={() => setSelectedPost({ ...selectedPost, showComments: !selectedPost.showComments })}
                                    >
                                        <BsChat className="mr-1" />
                                        {selectedPost.comments.length}
                                    </button>
                                </div>
                                {selectedPost.showComments && (
                                    <div className="mt-4">
                                        <h3 className="font-bold mb-4">Comments:</h3>
                                        <div className="max-h-40 overflow-y-auto">
                                            {selectedPost.comments.map((comment, index) => (
                                                <div key={index} className="mt-2">
                                                    <span className="font-bold">{comment.userId.username}: </span>
                                                    <span>{comment.comment}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4">
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                placeholder="Add a comment..."
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            />
                                            <button
                                                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md w-full"
                                                onClick={() => handleComment(selectedPost._id)}
                                            >
                                                Comment
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <button
                                    className="mt-2 text-red-500 flex items-center justify-center w-full"
                                    onClick={() => handleDeletePost(selectedPost._id)}
                                >
                                    <BsTrash className="mr-1" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SendFollowRequest;