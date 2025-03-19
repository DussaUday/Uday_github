import useGetConversations from "../../hooks/useGetConversations";
import Conversation from "./Conversation";
import useConversation from "../../zustand/useConversation";

const Conversations = () => {
    const { loading, conversations } = useGetConversations();
    const { unreadMessages } = useConversation();

    return (
        <div className="h-full w-full py-2 flex flex-col overflow-y-auto">
            {conversations
                .filter((conversation) => !conversation.isArchived) // Filter out archived conversations
                .sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
                })
                .map((conversation, idx) => {
                    const unreadCount = unreadMessages[conversation._id] || 0;
                    return (
                        <Conversation
                            key={conversation._id}
                            conversation={conversation}
                            lastIdx={idx === conversations.length - 1}
                            unreadCount={unreadCount}
                        />
                    );
                })}

            {loading ? <span className="loading loading-spinner mx-auto"></span> : null}
            {conversations.length === 0 && !loading && (
                <p className="text-center text-gray-500 mt-4">No conversations yet.</p>
            )}
        </div>
    );
};

export default Conversations;