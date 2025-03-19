import { create } from "zustand";
import { persist } from "zustand/middleware";

const useConversation = create(
    persist(
        (set, get) => ({
            // State
            messages: [],
            selectedConversation: null,
            unreadMessages: {},

            
            setMessages: (newMessages) => set({ messages: newMessages }),
            setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
            updateMessage: (messageId, updates) =>
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === messageId ? { ...msg, ...updates } : msg
                    ),
                })),
                incrementUnreadMessages: (conversationId) =>
                    set((state) => {
                        const updatedUnreadMessages = {
                            ...state.unreadMessages,
                            [conversationId]: (state.unreadMessages[conversationId] || 0) + 1,
                        };
                        return { unreadMessages: updatedUnreadMessages };
                    }),
                    resetUnreadMessages: (conversationId) =>
                        set((state) => {
                            const updatedUnreadMessages = {
                                ...state.unreadMessages,
                                [conversationId]: 0,
                            };
                            return { unreadMessages: updatedUnreadMessages };
                        }),
            addMessage: (newMessage) =>
                set((state) => ({
                    messages: [...state.messages, newMessage],
                })),
            deleteMessage: (messageId) =>
                set((state) => ({
                    messages: state.messages.filter((msg) => msg._id !== messageId),
                })),
            likeMessage: (messageId) =>
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg._id === messageId ? { ...msg, isLiked: true } : msg
                    ),
                })),
        }),
        {
            name: "conversation-storage", // Unique name for localStorage
            getStorage: () => localStorage, // Use localStorage for persistence
        }
    )
);

export default useConversation;