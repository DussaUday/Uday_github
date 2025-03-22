import { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "./AuthContext";
import useConversation from "../zustand/useConversation";
import io from "socket.io-client";
import PropTypes from "prop-types";
import dotenv from "dotenv";
//import usePost from "../hooks/usePost";

dotenv.config();

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();
    const { updateMessage, setMessages, messages = [], incrementUnreadMessages, unreadMessages } = useConversation();
    //const { setPosts } = usePost();
    const [followersDetails, setFollowersDetails] = useState([]);
    const [gameRequests, setGameRequests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (authUser) {
            const newSocket = io(process.env.BACKEND_URL, {
                query: { userId: authUser._id },
                transports: ["websocket", "polling"],
                reconnection: true
            });

            setSocket(newSocket);

            newSocket.on("connect", () => {
                console.log("Socket connected:", newSocket.id); // Debugging
            });

            newSocket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            newSocket.on("newMessage", (newMessage) => {
                newMessage.shouldShake = true;
                setMessages([...messages, newMessage]);

                // Ensure conversationId is passed correctly
                if (newMessage.conversationId) {
                    incrementUnreadMessages(newMessage.conversationId);
                } else {
                    console.error("conversationId is missing in newMessage:", newMessage);
                }
            });

            newSocket.on("messageLiked", ({ messageId }) => {
                updateMessage(messageId, { isLiked: true });
            });

            newSocket.on("messageDeleted", ({ messageId }) => {
                updateMessage(messageId, { message: "This message is deleted.", deleted: true });
            });

            newSocket.on("newFollowRequest", ({ senderId }) => {
                toast.success(`New follow request from ${senderId}`);
            });

            newSocket.on("followRequestAccepted", ({ receiverId }) => {
                toast.success(`Your follow request to ${receiverId} was accepted!`);
            });

            newSocket.on("followRequestRejected", ({ receiverId }) => {
                toast.error(`Your follow request to ${receiverId} was rejected.`);
            });

            newSocket.on("userUnfollowed", ({ unfollowerId, unfollowedUserId }) => {
                if (unfollowedUserId === authUser._id) {
                    // Ensure followersDetails is initialized
                    setFollowersDetails(prevFollowersDetails =>
                        prevFollowersDetails ? prevFollowersDetails.filter(user => user._id !== unfollowerId) : []
                    );
                }
            });

            newSocket.on("newGameRequest", (data) => {
                setGameRequests((prev) => [...prev, data]);
            });

            newSocket.on("gameRequestAccepted", (data) => {
                // Handle game request accepted
                console.log("Game request accepted:", data);
            });

            newSocket.on("gameRequestRejected", (data) => {
                // Handle game request rejected
                console.log("Game request rejected:", data);
            });

            newSocket.on("cellMarked", (data) => {
                // Handle cell marked
                console.log("Cell marked:", data);
            });

            return () => {
                newSocket.close();
            };
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [authUser, updateMessage, setMessages, messages, incrementUnreadMessages, unreadMessages]);

    return <SocketContext.Provider value={{ socket, onlineUsers, gameRequests }}>{children}</SocketContext.Provider>;
};

SocketContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
