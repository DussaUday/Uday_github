import { useState, useEffect } from "react";
import useProfile from "../../hooks/useProfile";
import useDeleteAccount from "../../hooks/useDeleteAccount";
import { useSocketContext } from "../../context/SocketContext";
import { toast } from "react-hot-toast";

const ProfilePage = ({ userId, onNewFollowRequest }) => {
    const { profile, loading: profileLoading, refetch } = useProfile(userId);
    const { deleteAccount, loading: deleteLoading } = useDeleteAccount();
    const { socket } = useSocketContext();

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");
    const [followRequests, setFollowRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [followersDetails, setFollowersDetails] = useState([]);
    const [followingDetails, setFollowingDetails] = useState([]);
    const [followRequestsDetails, setFollowRequestsDetails] = useState([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        profilePic: null,
    });
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        if (profile) {
            setFollowRequests(profile.followRequests || []);
            fetchUserDetails(profile.followers, setFollowersDetails);
            fetchUserDetails(profile.following, setFollowingDetails);
            fetchUserDetails(profile.followRequests, setFollowRequestsDetails);
        }
    }, [profile]);

    useEffect(() => {
        if (socket) {
            // Listen for new follow requests
            socket.on("newFollowRequest", (data) => {
                if (data.receiverId === userId) {
                    // Notify the parent component (Home) about the new follow request
                    if (onNewFollowRequest) {
                        onNewFollowRequest();
                    }
                }
            });
        }

        return () => {
            if (socket) {
                socket.off("newFollowRequest"); // Clean up socket listener
            }
        };
    }, [socket, userId, onNewFollowRequest]);

    const fetchUserDetails = async (userIds, setUserDetails) => {
        try {
            const uniqueUserIds = [...new Set(userIds)]; // Ensure unique user IDs
            const details = await Promise.all(
                uniqueUserIds.map(async (id) => {
                    const response = await fetch(`/api/users/${id}`);
                    if (!response.ok) {
                        return null; // Skip deleted users
                    }
                    const data = await response.json();
                    return data;
                })
            );
            setUserDetails(details.filter(user => user !== null)); // Filter out null values
        } catch (error) {
            console.error("Failed to fetch user details:", error);
        }
    };

    const handleAcceptFollowRequest = async (requestUserId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/accept-follow/${requestUserId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("acceptFollowRequest", { senderId: requestUserId, receiverId: userId });
                setFollowRequests(followRequests.filter(id => id !== requestUserId));
                setFollowRequestsDetails(followRequestsDetails.filter(user => user._id !== requestUserId));
                if (onNewFollowRequest) {
                    onNewFollowRequest(-1); // Decrement the count
                }
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error accepting follow request");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectFollowRequest = async (requestUserId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/reject-follow/${requestUserId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("rejectFollowRequest", { senderId: requestUserId, receiverId: userId });
                setFollowRequests(followRequests.filter(id => id !== requestUserId));
                setFollowRequestsDetails(followRequestsDetails.filter(user => user._id !== requestUserId));
                if (onNewFollowRequest) {
                    onNewFollowRequest(-1); // Decrement the count
                }
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error rejecting follow request");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete your account?");
        if (confirmDelete) {
            await deleteAccount();
        }
    };

    const handleUnfollow = async (userIdToUnfollow) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/unfollow/${userIdToUnfollow}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                setFollowingDetails(prevFollowingDetails =>
                    prevFollowingDetails.filter(user => user._id !== userIdToUnfollow)
                );
                socket.emit("unfollowUser", { senderId: userId, receiverId: userIdToUnfollow });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error unfollowing user");
        } finally {
            setLoading(false);
        }
    };

    const handleFollowBack = async (userIdToFollow) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/follow/${userIdToFollow}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("sendFollowRequest", { senderId: localStorage.getItem("userId"), receiverId: userIdToFollow });
                setSuggestions(prev => prev.filter(id => id !== userIdToFollow));
                setFollowingDetails(prev => [...prev, { _id: userIdToFollow }]);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error following user");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveSuggestion = (userIdToRemove) => {
        setSuggestions(prev => prev.filter(id => id !== userIdToRemove));
    };

    const handleEditProfile = () => {
        setShowEditProfile(true);
        setEditProfileData({
            username: profile.username,
            password: "",
            confirmPassword: "",
            profilePic: null,
        });
        setPreviewUrl(profile.profilePic);
    };

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditProfileData(prev => ({ ...prev, profilePic: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("username", editProfileData.username);
        formData.append("password", editProfileData.password);
        formData.append("confirmPassword", editProfileData.confirmPassword);
        if (editProfileData.profilePic) {
            formData.append("profilePic", editProfileData.profilePic);
        }

        try {
            const response = await fetch(`/api/auth/edit-profile/${userId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                refetch();
                setShowEditProfile(false);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex z-40 bg-blue">
            {/* Profile Container */}
            <div className="w-full bg-transparent border-r border-gray-200 ml-16">
                <div className="max-w-4xl w-full bg-blue rounded-lg shadow-lg p-6 mx-auto mt-10">
                    <div className="text-center">
                        <img
                            src={profile?.profilePic}
                            alt={`${profile?.username}'s profile`}
                            className="w-40 h-40 rounded-full mx-auto mb-4 object-cover"
                        />
                        <h2 className="text-2xl font-semibold text-gray-800">{profile?.fullName}</h2>
                        <p className="text-gray-600 text-lg">@{profile?.username}</p>
                        <button
                            onClick={handleEditProfile}
                            className="mt-4 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-150"
                        >
                            Edit Profile
                        </button>
                    </div>

                    {/* Edit Profile Modal */}
                    {showEditProfile && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowEditProfile(false)}>
                            <div className="bg-white p-6 rounded-lg w-96" onClick={(e) => e.stopPropagation()}>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Profile</h2>
                                <form onSubmit={handleEditProfileSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">Username</label>
                                        <input
                                            type="text"
                                            value={editProfileData.username}
                                            onChange={(e) => setEditProfileData(prev => ({ ...prev, username: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                                        <input
                                            type="password"
                                            value={editProfileData.password}
                                            onChange={(e) => setEditProfileData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={editProfileData.confirmPassword}
                                            onChange={(e) => setEditProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfilePicChange}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                        {previewUrl && <img src={previewUrl} alt="Profile Preview" className="w-24 h-24 rounded-full mt-2" />}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditProfile(false)}
                                            className="mr-2 px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition duration-150"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-150"
                                        >
                                            {loading ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Followers and Following Buttons */}
                    <div className="mt-6 flex justify-center space-x-4">
                        <button
                            onClick={() => setShowFollowers(!showFollowers)}
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-150"
                        >
                            Followers ({followersDetails.length})
                        </button>
                        <button
                            onClick={() => setShowFollowing(!showFollowing)}
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-150"
                        >
                            Following ({followingDetails.length})
                        </button>
                    </div>

                    {/* Followers List Modal */}
                    {showFollowers && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowFollowers(false)}>
                            <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Followers</h2>
                                <ul>
                                    {followersDetails.map(follower => (
                                        <li key={follower._id} className="py-2 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <img
                                                    src={follower.profilePic}
                                                    alt={follower.fullName}
                                                    className="w-8 h-8 rounded-full mr-2"
                                                />
                                                <p>{follower.fullName}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Following List Modal */}
                    {showFollowing && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={() => setShowFollowing(false)}>
                            <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Following</h2>
                                <ul>
                                    {followingDetails.map(following => (
                                        <li key={following._id} className="py-2 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <img
                                                    src={following.profilePic}
                                                    alt={following.fullName}
                                                    className="w-8 h-8 rounded-full mr-2"
                                                />
                                                <p>{following.fullName}</p>
                                            </div>
                                            <button
                                                onClick={() => handleUnfollow(following._id)}
                                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150"
                                            >
                                                Unfollow
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Follow Requests Section */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-gray-800">Follow Requests</h2>
                        <ul>
                            {followRequestsDetails.map(requestUser => (
                                <li key={requestUser._id} className="flex items-center justify-between py-2">
                                    <div className="flex items-center">
                                        <img
                                            src={requestUser.profilePic}
                                            alt={requestUser.fullName}
                                            className="w-8 h-8 rounded-full mr-2"
                                        />
                                        <div>
                                            <p className="font-semibold">{requestUser.fullName}</p>
                                            <p className="text-sm text-gray-600">@{requestUser.username}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {suggestions.includes(requestUser._id) ? (
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => handleFollowBack(requestUser._id)}
                                                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition duration-150 mr-2"
                                                >
                                                    Follow Back
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveSuggestion(requestUser._id)}
                                                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <button
                                                    onClick={() => handleAcceptFollowRequest(requestUser._id)}
                                                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition duration-150 mr-2"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectFollowRequest(requestUser._id)}
                                                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Delete Account Section */}
                    <div className="flex justify-between mt-6">
                        {!showConfirmation ? (
                            <button
                                onClick={() => setShowConfirmation(true)}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Type 'DELETE' to confirm"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    className="px-4 py-2 border rounded-lg"
                                />
                                {confirmationText === "DELETE" && (
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleteLoading}
                                        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150"
                                    >
                                        {deleteLoading ? "Deleting..." : "Confirm Delete"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;