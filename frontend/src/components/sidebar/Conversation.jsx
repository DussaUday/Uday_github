import { useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import PropTypes from "prop-types";

const Conversation = ({ conversation, lastIdx, unreadCount, onClick }) => {
    const { selectedConversation, setSelectedConversation, resetUnreadMessages } = useConversation();
    const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);

    const isSelected = selectedConversation?._id === conversation._id;
    const { onlineUsers } = useSocketContext();
    const isOnline = onlineUsers.includes(conversation._id);

    const handleProfilePicClick = () => {
        setIsProfilePicModalOpen(true);
    };

    const closeProfilePicModal = () => {
        setIsProfilePicModalOpen(false);
    };

    const handleConversationClick = () => {
        console.log("Resetting unread count for conversation:", conversation._id);
        setSelectedConversation(conversation);
        resetUnreadMessages(conversation._id); // Reset unread count for this conversation
        onClick(); // Call the onClick prop to handle the view change
    };

    return (
        <>
            <div
                className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer ${
                    isSelected ? "bg-sky-500" : ""
                }`}
                onClick={handleConversationClick}
            >
                <div className={`avatar ${isOnline ? "online" : ""}`} onClick={handleProfilePicClick}>
                    <div className='w-12 rounded-full'>
                        <img src={conversation.profilePic} alt='user avatar' />
                    </div>
                </div>

                <div className='flex flex-col flex-1'>
                    <div className='flex gap-3 justify-between'>
                        <p className='font-bold text-gray-200'>{conversation.fullName}</p>
                        {unreadCount > 0 && (
                            <span className="text-sm text-white bg-green-500 rounded-full px-2 py-1">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <p className='text-sm text-gray-400'>you:{conversation.lastMessage}</p>
                    )}
                </div>
            </div>

            {!lastIdx && <div className='divider my-0 py-0 h-1' />}

            {isProfilePicModalOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50' onClick={closeProfilePicModal}>
                    <div className='bg-black p-4 rounded-lg z-50'>
                        <img src={conversation.profilePic} alt='user avatar' className='w-64 h-64 rounded-full' />
                    </div>
                </div>
            )}
        </>
    );
};

export default Conversation;

Conversation.propTypes = {
    conversation: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        profilePic: PropTypes.string.isRequired,
        fullName: PropTypes.string.isRequired,
        lastMessage: PropTypes.string,
    }).isRequired,
    lastIdx: PropTypes.bool,
    unreadCount: PropTypes.number,
    onClick: PropTypes.func.isRequired, // Add onClick to propTypes
};