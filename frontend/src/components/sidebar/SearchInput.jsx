import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import useGetConversations from "../../hooks/useGetConversations";
import toast from "react-hot-toast";

const SearchInput = () => {
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]); // State for search suggestions
    const { setSelectedConversation } = useConversation();
    const { conversations } = useGetConversations();

    // Update suggestions based on the current search input
    useEffect(() => {
        if (search) {
            const filteredSuggestions = conversations.filter((conversation) =>
                conversation.fullName.toLowerCase().includes(search.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [search, conversations]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!search) return;
        if (search.length < 3) {
            return toast.error("Search term must be at least 3 characters long");
        }

        const conversation = conversations.find((c) =>
            c.fullName.toLowerCase().includes(search.toLowerCase())
        );

        if (conversation) {
            setSelectedConversation(conversation);
            setSearch("");
        } else {
            toast.error("No such user found!");
        }
    };

    const handleSuggestionClick = (conversation) => {
        setSelectedConversation(conversation);
        setSearch("");
        setSuggestions([]); // Clear suggestions after selection
    };

    return (
        <div className="relative">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search…"
                    className="input input-bordered rounded-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-circle bg-sky-500 text-white">
                    <IoSearchSharp className="w-6 h-6 outline-none" />
                </button>
            </form>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
                <div className="absolute top-12 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {suggestions.map((conversation, index) => (
                        <div
                            key={conversation._id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSuggestionClick(conversation)}
                        >
                            {conversation.fullName}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchInput;


