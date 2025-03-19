import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import useLikeMessage from "../../hooks/useLikeMessage";
import useDeleteMessage from "../../hooks/useDeleteMessage";
import { Menu, MenuItem, IconButton, Modal, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PropTypes from "prop-types";
import { useEffect } from "react";

const Message = ({ message }) => {
    const { authUser } = useAuthContext();
    const { selectedConversation, resetUnreadMessages } = useConversation();
    const { likeMessage } = useLikeMessage();
    const { deleteMessage } = useDeleteMessage();
    const [anchorEl, setAnchorEl] = useState(null);
    const [isMediaOpen, setIsMediaOpen] = useState(false); // State for media modal

    const fromMe = message.senderId === authUser._id;
    const formattedTime = extractTime(message.createdAt);
    const chatClassName = fromMe ? "chat-end" : "chat-start";
    const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
    const bubbleBgColor = fromMe ? "bg-blue-500" : "";

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLike = () => {
        likeMessage(message._id);
        handleMenuClose();
    };

    const handleDelete = () => {
        deleteMessage(message._id);
        handleMenuClose();
    };

    const handleOpenMedia = () => {
        setIsMediaOpen(true); // Open the media modal
    };

    const handleCloseMedia = () => {
        setIsMediaOpen(false); // Close the media modal
    };

    useEffect(() => {
        if (!fromMe) {
            resetUnreadMessages(selectedConversation._id);
        }
    }, [fromMe, resetUnreadMessages, selectedConversation]);

    // Determine the file type
    const fileType = message.file?.split(".").pop()?.toLowerCase();

    return (
        <div className={`chat ${chatClassName}`}>
            <div className='chat-image avatar'>
                <div className='w-10 rounded-full'>
                    <img alt='Profile' src={profilePic} />
                </div>
            </div>
            <div className={`chat-bubble text-white ${bubbleBgColor} pb-2`}>
                {message.deleted ? (
                    <span className='text-red-500'>This message is deleted.</span>
                ) : (
                    <>
                        {message.message && <p>{message.message}</p>}
                        {message.file && (
                            <div className="mt-2">
                                {fileType === "pdf" ? (
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer"
                                        onClick={handleOpenMedia}
                                    >
                                        <span className="text-blue-500 underline">
                                            Open PDF
                                        </span>
                                    </div>
                                ) : fileType?.match(/mp4|mov|avi|mkv/) ? (
                                    <div 
                                        className="relative cursor-pointer"
                                        onClick={handleOpenMedia}
                                    >
                                        <video 
                                            src={message.file} 
                                            className="max-w-[200px] h-auto rounded-lg" 
                                            controls
                                        />
                                    </div>
                                ) : fileType?.match(/jpg|jpeg|png|gif/) ? (
                                    <div 
                                        className="relative cursor-pointer"
                                        onClick={handleOpenMedia}
                                    >
                                        <img 
                                            src={message.file} 
                                            alt="Uploaded" 
                                            className="max-w-[200px] h-auto rounded-lg" 
                                        />
                                    </div>
                                ) : (
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer"
                                        onClick={handleOpenMedia}
                                    >
                                        <span className="text-blue-500 underline">
                                            Open File
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
                {message.isLiked && <FavoriteIcon className='text-red-500 ml-2' fontSize='small' />}
            </div>
            <div className='chat-footer opacity-50 text-xs flex gap-1 items-center'>
                {formattedTime}
                {fromMe ? (
                    <>
                        <IconButton onClick={handleMenuOpen} size='small'>
                            <MoreVertIcon fontSize='small' />
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                            <MenuItem onClick={handleLike}>❤️ Like</MenuItem>
                            <MenuItem onClick={handleDelete}>🗑️ Delete</MenuItem>
                        </Menu>
                    </>
                ) : (
                    !message.isLiked && (
                        <IconButton onClick={handleLike} size='small'>
                            <FavoriteIcon fontSize='small' />
                        </IconButton>
                    )
                )}
            </div>

            {/* Media Modal */}
            <Modal open={isMediaOpen} onClose={handleCloseMedia}>
                <Box 
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 2,
                        outline: "none",
                    }}
                >
                    {fileType === "pdf" ? (
                        <iframe 
                            src={message.file} 
                            title="PDF Preview" 
                            style={{ width: "90vw", height: "90vh" }} 
                        />
                    ) : fileType?.match(/mp4|mov|avi|mkv/) ? (
                        <video 
                            src={message.file} 
                            controls 
                            style={{ width: "90vw", height: "90vh" }} 
                        />
                    ) : fileType?.match(/jpg|jpeg|png|gif/) ? (
                        <img 
                            src={message.file} 
                            alt="Uploaded" 
                            style={{ maxWidth: "90vw", maxHeight: "90vh" }} 
                        />
                    ) : (
                        <iframe 
                            src={message.file} 
                            title="File Preview" 
                            style={{ width: "90vw", height: "90vh" }} 
                        />
                    )}
                </Box>
            </Modal>
        </div>
    );
};

Message.propTypes = {
    message: PropTypes.shape({
        senderId: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        _id: PropTypes.string.isRequired,
        deleted: PropTypes.bool.isRequired,
        message: PropTypes.string.isRequired,
        file: PropTypes.string,
        isLiked: PropTypes.bool.isRequired,
    }).isRequired,
};

export default Message;