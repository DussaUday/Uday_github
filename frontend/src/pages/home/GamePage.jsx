import React, { useState, useEffect } from "react";
import { useSocketContext } from "../../context/SocketContext";
import { toast } from "react-hot-toast";
import { IoSearchSharp } from "react-icons/io5";
import useSearchConversation from "./useSearchConversation";

const GamePage = ({ onGameRequestUpdate }) => {
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [gameRequests, setGameRequests] = useState([]);
    const [gameState, setGameState] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(30);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [isRequestSender, setIsRequestSender] = useState(false);
    const [showRules, setShowRules] = useState(false); // State to control rules visibility
    const { socket } = useSocketContext();
    const { suggestions, loading: searchLoading, error } = useSearchConversation(search);

    // Fetch pending game requests on component mount
    useEffect(() => {
        const fetchPendingGameRequests = async () => {
            try {
                const response = await fetch(`/api/games/pending-requests`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                const data = await response.json();
                if (response.ok) {
                    setGameRequests(data);
                } else {
                    toast.error(data.error);
                }
            } catch (error) {
                toast.error("Error fetching pending game requests");
            }
        };

        fetchPendingGameRequests();
    }, []);

    // Update localStorage and notify parent component when gameRequests change
    useEffect(() => {
        localStorage.setItem("gameRequests", JSON.stringify(gameRequests));
        if (onGameRequestUpdate) {
            onGameRequestUpdate(gameRequests.length);
        }
    }, [gameRequests, onGameRequestUpdate]);

    // Handle sending a game request
    const handleSendGameRequest = async (userId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/games/send-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ receiverId: userId }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("sendGameRequest", { receiverId: userId });
                setIsRequestSender(true);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error sending game request");
        } finally {
            setLoading(false);
        }
    };

    // Handle accepting a game request
    const handleAcceptGameRequest = async (requestId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/games/accept-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ requestId }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("acceptGameRequest", { requestId });
                setGameRequests((prev) => prev.filter((req) => req._id !== requestId));
                localStorage.setItem("gameRequests", JSON.stringify(gameRequests.filter((req) => req._id !== requestId)));

                setGameState({
                    _id: requestId,
                    player1Grid: data.player1Grid,
                    player2Grid: data.player2Grid,
                    markedCells: [],
                    currentPlayer: "player1",
                    winner: null,
                });
                setCurrentPlayer("player2");
                setIsRequestSender(false);
                startTimer();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error accepting game request");
        } finally {
            setLoading(false);
        }
    };

    // Handle rejecting a game request
    const handleRejectGameRequest = async (requestId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/games/reject-request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ requestId }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("rejectGameRequest", { requestId });
                setGameRequests((prev) => prev.filter((req) => req._id !== requestId));
                localStorage.setItem("gameRequests", JSON.stringify(gameRequests.filter((req) => req._id !== requestId)));
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error rejecting game request");
        } finally {
            setLoading(false);
        }
    };

    // Handle marking a cell in the game grid
    const handleMarkCell = async (number) => {
        if (!gameState) {
            console.error("No active game state");
            return;
        }

        if (currentPlayer !== "player1" && currentPlayer !== "player2") {
            console.error("Not your turn");
            return;
        }

        if (gameState.markedCells.includes(number)) {
            toast.error("Cell already marked");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/games/mark-cell`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ gameId: gameState._id, number }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("markCell", { gameId: gameState._id, number });
                setGameState((prevState) => ({
                    ...prevState,
                    markedCells: [...prevState.markedCells, number],
                    currentPlayer: prevState.currentPlayer === "player1" ? "player2" : "player1",
                }));
                setCurrentPlayer(currentPlayer === "player1" ? "player2" : "player1");
                setTimer(30);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error marking cell");
        } finally {
            setLoading(false);
        }
    };

    // Handle stopping the game
    const handleStopGame = async () => {
        if (!gameState) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/games/stop-game`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ gameId: gameState._id }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                socket.emit("stopGame", { gameId: gameState._id });
                setGameState(null);
                setCurrentPlayer(null);
                setTimer(30);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error stopping game");
        } finally {
            setLoading(false);
        }
    };

    // Socket event listeners
    useEffect(() => {
        if (socket) {
            socket.on("newGameRequest", (data) => {
                setGameRequests((prev) => [...prev, data]);
                localStorage.setItem("gameRequests", JSON.stringify([...gameRequests, data]));
                toast.success("New game request received");
            });

            socket.on("gameRequestAccepted", (data) => {
                setGameState({
                    _id: data._id,
                    player1Grid: data.player1Grid,
                    player2Grid: data.player2Grid,
                    markedCells: [],
                    currentPlayer: "player1",
                    winner: null,
                });
                setCurrentPlayer("player1");
                startTimer();
            });

            socket.on("gameRequestRejected", () => {
                toast.error("Game request rejected");
            });

            socket.on("cellMarked", (data) => {
                setGameState((prevState) => ({
                    ...prevState,
                    markedCells: data.markedCells,
                    currentPlayer: data.currentPlayer,
                    winner: data.winner,
                }));
                if (data.winner) {
                    toast.success(`Game over! Winner: ${data.winner}`);
                    setTimeout(() => {
                        setGameState(null);
                    }, 5000);
                }
            });

            socket.on("gameStopped", () => {
                toast.success("Game stopped successfully");
                setGameState(null);
                setCurrentPlayer(null);
                setTimer(30);
            });
        }

        return () => {
            if (socket) {
                socket.off("newGameRequest");
                socket.off("gameRequestAccepted");
                socket.off("gameRequestRejected");
                socket.off("cellMarked");
                socket.off("gameStopped");
            }
        };
    }, [socket]);

    // Timer logic
    useEffect(() => {
        if (timer > 0 && currentPlayer) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else if (timer === 0 && currentPlayer) {
            setCurrentPlayer(currentPlayer === "player1" ? "player2" : "player1");
            setTimer(30);
        }
    }, [timer, currentPlayer]);

    const startTimer = () => {
        setTimer(30);
    };

    // Function to check if a line is completed
    const isLineCompleted = (grid, markedCells, line) => {
        return line.every(index => markedCells.includes(grid[index]));
    };

    // Function to get completed lines
    const getCompletedLines = (grid, markedCells) => {
        const winningCombinations = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14],
            [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22],
            [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Columns
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
        ];

        return winningCombinations.filter(line => isLineCompleted(grid, markedCells, line));
    };

    // Function to get the class for a cell based on its state
    const getCellClass = (num, grid, markedCells, completedLines) => {
        if (markedCells.includes(num)) {
            const index = grid.indexOf(num);
            const isCompleted = completedLines.some(line => line.includes(index));
            return isCompleted ? "bg-red-500 text-white" : "bg-yellow-400 text-black";
        }
        return "bg-green-500 text-white";
    };

    return (
        <div className="flex flex-col h-full">
            {/* Top Section: Game Requests */}
            <div className="w-full p-4 border-b border-gray-200">
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

                {suggestions.length > 0 && (
                    <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                        {suggestions.map((conversation) => (
                            <div
                                key={conversation?._id}
                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                onClick={() => setSelectedUser(conversation)}
                            >
                                <img
                                    src={conversation?.profilePic || "default-profile-pic-url"}
                                    alt={conversation?.fullName || "User"}
                                    className="w-8 h-8 rounded-full"
                                />
                                <div>
                                    <p className="font-bold">{conversation?.fullName || "Unknown User"}</p>
                                    <p className="text-sm text-gray-500">@{conversation?.username || "unknown"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedUser && (
                    <div className="mt-4">
                        <div className="flex items-center space-x-4">
                            <img
                                src={selectedUser?.profilePic || "default-profile-pic-url"}
                                alt={selectedUser?.fullName || "User"}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                                <p className="font-semibold text-gray-800">{selectedUser?.fullName || "Unknown User"}</p>
                                <p className="text-sm text-gray-500">@{selectedUser?.username || "unknown"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleSendGameRequest(selectedUser._id)}
                            className="mt-4 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition duration-150"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send Game Request"}
                        </button>
                    </div>
                )}

                <div className="mt-4">
                    <h2 className="text-xl font-semibold">Game Requests</h2>
                    <ul>
                        {gameRequests.map((request) => (
                            <li key={request?._id} className="flex items-center justify-between py-2">
                                <div className="flex items-center">
                                    <img
                                        src={request?.sender?.profilePic || "default-profile-pic-url"}
                                        alt={request?.sender?.fullName || "User"}
                                        className="w-8 h-8 rounded-full mr-2"
                                    />
                                    <div>
                                        <p className="font-semibold">{request?.sender?.fullName || "Unknown User"}</p>
                                        <p className="text-sm text-gray-600">@{request?.sender?.username || "unknown"}</p>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleAcceptGameRequest(request._id)}
                                        className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition duration-150 mr-2"
                                        disabled={loading}
                                    >
                                        {loading ? "Accepting..." : "Accept"}
                                    </button>
                                    <button
                                        onClick={() => handleRejectGameRequest(request._id)}
                                        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150"
                                        disabled={loading}
                                    >
                                        {loading ? "Rejecting..." : "Reject"}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Middle Section: Game Rules Button */}
            <div className="flex justify-center p-2">
                <button
                    onClick={() => setShowRules(!showRules)}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-150"
                >
                    {showRules ? "Hide Game Rules" : "Show Game Rules"}
                </button>
            </div>

            {/* Bottom Section: Game Grid */}
            <div className="flex-1 p-4">
                {gameState ? (
                    <div className="container mx-auto">
                        <h1 className="text-3xl font-bold text-center mb-4">Two-Player Bingo Game</h1>
                        <div className="grid-container flex justify-center gap-8">
                            <div>
                                <div className="player-label text-xl font-semibold mb-2">Your Grid</div>
                                <div className="grid grid-cols-5 gap-2">
                                    {(isRequestSender ? gameState.player1Grid : gameState.player2Grid).map((num, index) => {
                                        const completedLines = getCompletedLines(
                                            isRequestSender ? gameState.player1Grid : gameState.player2Grid,
                                            gameState.markedCells
                                        );
                                        return (
                                            <div
                                                key={index}
                                                className={`cell w-16 h-16 flex items-center justify-center font-bold text-xl rounded-lg cursor-pointer ${
                                                    getCellClass(
                                                        num,
                                                        isRequestSender ? gameState.player1Grid : gameState.player2Grid,
                                                        gameState.markedCells,
                                                        completedLines
                                                    )
                                                }`}
                                                onClick={() => handleMarkCell(num)}
                                            >
                                                {num}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        {gameState.winner && (
                            <div className="winner-message text-4xl font-bold text-yellow-800 mt-4">
                                {gameState.winner === (isRequestSender ? "player1" : "player2") ? (
                                    <span>You win!</span>
                                ) : (
                                    <span>You lose!</span>
                                )}
                            </div>
                        )}
                        {currentPlayer === (isRequestSender ? "player1" : "player2") && (
                            <div className="timer text-3xl font-bold mt-4 text-red-600">
                                Time left: {timer} seconds
                            </div>
                        )}
                        <button
                            onClick={handleStopGame}
                            className="mt-4 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150"
                            disabled={loading}
                        >
                            {loading ? "Stopping..." : "Stop Game"}
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center">Select a user to start the game.</p>
                )}
            </div>

            {/* Game Rules Modal */}
            {showRules && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                    onClick={() => setShowRules(false)}
                >
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Game Rules</h2>
                        <div className="space-y-4">
                        <div>
                                <h3 className="font-semibold">NOTE: Game Request</h3>
                                <ul className="list-disc pl-5">
                                    <li>Send or accept the request to start game </li>
                                    <li>you can send game request to only with your friends your followers list or following list.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold">1. Game Setup</h3>
                                <ul className="list-disc pl-5">
                                    <li>The game consists of two players, each with a 5x5 Bingo grid.</li>
                                    <li>Each grid contains 25 unique random numbers ranging from 1 to 25.</li>
                                    <li>Players take turns marking numbers on their respective grids.</li>
                                    <li>The game starts when the "Start Game" button is clicked.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold">2. How to Play</h3>
                                <ul className="list-disc pl-5">
                                    <li>Player 1 starts first.</li>
                                    <li>A player can click on a number in their grid to mark it.</li>
                                    <li>The same number in the opponent’s grid is also marked automatically.</li>
                                    <li>After marking a number, turns switch to the other player.</li>
                                    <li>Players cannot mark numbers when it's not their turn.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold">3. Marking Rules</h3>
                                <ul className="list-disc pl-5">
                                    <li>A marked number changes color to gold (yellow).</li>
                                    <li>Players can only mark one number per turn.</li>
                                    <li>Once a number is marked, it remains marked for the rest of the game.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold">4. Winning Condition</h3>
                                <ul className="list-disc pl-5">
                                    <li>A player wins when they complete at least 5 full lines in their grid.</li>
                                    <li>A line consists of 5 marked numbers in any of the following ways:
                                        <ul className="list-disc pl-5">
                                            <li>Horizontal row (5 rows)</li>
                                            <li>Vertical column (5 columns)</li>
                                            <li>Diagonal (2 diagonals)</li>
                                        </ul>
                                    </li>
                                    <li>The game automatically checks for a winner after each move.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold">5. Declaring a Winner</h3>
                                <ul className="list-disc pl-5">
                                    <li>When a player completes 5 lines, they win the game.</li>
                                    <li>A message appears: "Player X wins!".</li>
                                    <li>Once a winner is declared, the game ends, and no more moves can be made.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamePage;