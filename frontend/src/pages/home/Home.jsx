import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import Sidebar from "../../components/sidebar/Sidebar";
import MessageContainer from "../../components/messages/MessageContainer";
import { FaCommentDots, FaHome, FaUser, FaPlus, FaSearch, FaGamepad } from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext";
import ProfilePage from "../profile/ProfilePage";
import CreatePost from "../../components/posts/CreatePost.jsx";
import PostList from "../../components/posts/PostList.jsx";
import SearchPage from "./SearchInput.jsx";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import GamePage from "./GamePage.jsx";

const Home = () => {
    const [activeView, setActiveView] = useState('home');
    const [showMessages, setShowMessages] = useState(false);
    const { authUser } = useAuthContext();
    const [newFollowRequestsCount, setNewFollowRequestsCount] = useState(0);
    const [newGameRequestsCount, setNewGameRequestsCount] = useState(0);
    const { socket } = useSocketContext();
    const { unreadMessages, resetUnreadMessages } = useConversation();

    const totalUnreadCount = Object.values(unreadMessages).reduce((acc, count) => acc + count, 0);

    useEffect(() => {
        const storedGameRequests = JSON.parse(localStorage.getItem("gameRequests")) || [];
        setNewGameRequestsCount(storedGameRequests.length);
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on("newGameRequest", () => {
                setNewGameRequestsCount((prev) => prev + 1);
            });

            socket.on("newFollowRequest", () => {
                setNewFollowRequestsCount((prev) => prev + 1);
            });
        }

        return () => {
            if (socket) {
                socket.off("newGameRequest");
                socket.off("newFollowRequest");
            }
        };
    }, [socket]);

    const handleNewFollowRequest = (change = 1) => {
        setNewFollowRequestsCount((prev) => prev + change); // Increment or decrement the count
    };

    const handleGameRequestUpdate = (newCount) => {
        setNewGameRequestsCount(newCount);
    };

    const handleViewChange = (view) => {
        setActiveView(view);
        if (view === 'profile') {
            setNewFollowRequestsCount(0); // Reset count when profile page is opened
        }
        if (view === 'messages') {
            setShowMessages(true);
            Object.keys(unreadMessages).forEach(conversationId => {
                resetUnreadMessages(conversationId);
            });
        } else {
            setShowMessages(false);
        }
    };

    const handleBackToSidebar = () => {
        setShowMessages(true);
    };

    return (
        <div className="flex h-screen w-screen bg-transparent">
            <div className="fixed left-0 top-0 bottom-0 flex flex-col items-center w-16 bg-blue-900 py-4 space-y-6 z-50">
                <button
                    onClick={() => handleViewChange('home')}
                    className="p-2 rounded-full hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-110"
                >
                    <FaHome className="w-6 h-6 text-white" />
                </button>
                <button
                    onClick={() => handleViewChange('search')}
                    className="p-2 rounded-full hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-110"
                >
                    <FaSearch className="w-6 h-6 text-white" />
                </button>
                <button
                    onClick={() => handleViewChange('messages')}
                    className="p-2 rounded-full hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-110 relative"
                >
                    <FaCommentDots className="w-6 h-6 text-white" />
                    {totalUnreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-green-500 text-white text-xs rounded-full px-1">
                            {totalUnreadCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => handleViewChange('newpost')}
                    className="p-2 rounded-full hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-110"
                >
                    <FaPlus className="w-6 h-6 text-white" />
                </button>
                <button
                    onClick={() => handleViewChange('profile')}
                    className="p-2 rounded-full hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-110 relative"
                >
                    <FaUser className="w-6 h-6 text-white" />
                    {newFollowRequestsCount > 0 && (
                        <span className="absolute top-0 right-0 bg-green-500 text-white text-xs rounded-full px-1">
                            {newFollowRequestsCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => handleViewChange('game')}
                    className="p-2 rounded-full hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-110 relative"
                >
                    <FaGamepad className="w-6 h-6 text-white" />
                    {newGameRequestsCount > 0 && (
                        <span className="absolute top-0 right-0 bg-green-500 text-white text-xs rounded-full px-1">
                            {newGameRequestsCount}
                        </span>
                    )}
                </button>
                <div className="transform hover:scale-110 transition duration-300">
                    <LogoutButton />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto ml-16">
                {activeView === 'home' && (
                    <div className="p-4">
                        <PostList />
                    </div>
                )}
                {activeView === 'search' && <SearchPage />}
                {activeView === 'profile' && (
                    <ProfilePage
                        userId={authUser?._id}
                        onNewFollowRequest={handleNewFollowRequest}
                    />
                )}
                {activeView === 'newpost' && <CreatePost />}
                {activeView === 'messages' && (
                    <div className="fixed inset-0 flex z-40 bg-transparent">
                        {showMessages && (
                            <div className="w-72 bg-transparent border-r border-gray-200 ml-16">
                                <Sidebar />
                            </div>
                        )}
                        <div className="flex-1 bg-transparent">
                            <MessageContainer onBack={handleBackToSidebar} />
                        </div>
                    </div>
                )}
                {activeView === 'game' && <GamePage onGameRequestUpdate={handleGameRequestUpdate} />}
            </div>
        </div>
    );
};

export default Home;