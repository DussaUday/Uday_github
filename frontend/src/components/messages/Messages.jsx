import { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import useListenMessages from "../../hooks/useListenMessages";
import useConversation from "../../zustand/useConversation";
const Messages = () => {
    const { messages, loading } = useGetMessages();
    const { selectedConversation, unreadMessages } = useConversation();
    useListenMessages();
    const lastMessageRef = useRef();

    useEffect(() => {
        setTimeout(() => {
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);
    console.log("unreadMessages in Messages component:", unreadMessages);
    const filteredMessages = messages.filter(
        (message) =>
            message.senderId === selectedConversation._id || message.receiverId === selectedConversation._id
    );

    return (
        <div className='px-4 flex-1 overflow-auto'>
            {!loading && filteredMessages.length > 0 &&
                filteredMessages.map((message) => (
                    <div key={message._id} ref={lastMessageRef}>
                        <Message message={message} />
                    </div>
                ))
            }
            {loading && [...Array(3)].map((_, idx) => <MessageSkeleton key={idx} />)}
            {!loading && filteredMessages.length === 0 && (
                <p className='text-center'>Send a message to start the conversation</p>
            )}
        </div>
    );
};
export default Messages;