import { useState } from "react";
import { IoSearchSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";
import useSearchConversation from "../../hooks/useSearchConversation";
import SendFollowRequest from "./SendFollowRequest";

const SearchPage = () => {
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const { setSelectedConversation } = useConversation();
    const { suggestions, loading, error } = useSearchConversation(search);

    const handleSuggestionClick = (conversation) => {
        setSelectedUser(conversation);
        setSearch("");
    };

    if (error) {
        toast.error("Failed to fetch conversations");
    }

    return (
        <div className="flex h-full">
            {/* Search Section */}
            <div className="w-1/3 p-4 border-r border-gray-200">
                <form className="flex items-center gap-2">
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
                    <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {suggestions.map((conversation) => (
                            <div
                                key={conversation._id}
                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                onClick={() => handleSuggestionClick(conversation)}
                            >
                                <img
                                    src={conversation.profilePic}
                                    alt={conversation.fullName}
                                    className="w-8 h-8 rounded-full"
                                />
                                <div>
                                    <p className="font-bold">{conversation.fullName}</p>
                                    <p className="text-sm text-gray-500">@{conversation.username}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Page */}
            <div className="flex-1 p-4">
                {selectedUser ? (
                    <div>
                        <div className="flex items-center space-x-4">
                            <img
                                src={selectedUser.profilePic}
                                alt={selectedUser.fullName}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-semibold text-gray-800">{selectedUser.fullName}</p>
                                <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                            </div>
                        </div>
                        <SendFollowRequest 
                            userId={selectedUser._id} 
                            userName={selectedUser.fullName} 
                            profilePic={selectedUser.profilePic} 
                        />
                    </div>
                ) : (
                    <p className="text-gray-500">Select a user to view their request page.</p>
                )}
            </div>
        </div>
    );
};

export default SearchPage;