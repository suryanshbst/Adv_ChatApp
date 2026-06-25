"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/button";
import {
  PlusCircle,
  Users,
  LogOut,
  Copy,
  ArrowRight,
  AlertCircle,
  Check,
  RefreshCcw,
  Trash2,
} from "lucide-react";

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [roomName, setRoomName] = useState<string>("");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [joinError, setJoinError] = useState<string>("");
  const [createError, setCreateError] = useState<string>("");
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isCodeCopied, setIsCodeCopied] = useState<boolean>(false);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const router = useRouter();
  const burl = process.env.NEXT_PUBLIC_HTTP_BACKEND || "http://localhost:3002";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserName = localStorage.getItem("userName");
    const storedUserId = localStorage.getItem("userId");

    if (!token) {
      router.push("/signin");
      return;
    }

    if (storedUserName) setUserName(storedUserName);
    if (storedUserId) setUserId(storedUserId);

    fetchActiveRooms();
  }, [router]);

  const fetchActiveRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${burl}/api/room/all`, {
        headers: {
          Authorization: `${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Failed to fetch active rooms:", error);
    }
  };

  const generateRoomCode = () => {
    setIsGeneratingCode(true);
    setCreateError("");

    try {
      const code = Math.floor(10000 + Math.random() * 90000).toString();
      setGeneratedCode(code);
      setIsCodeCopied(false);
      setRoomName(`Room-${code}`);
    } catch (error) {
      setCreateError("Failed to generate a room code. Please try again.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setIsCodeCopied(true);
      setTimeout(() => setIsCodeCopied(false), 3000);
    }
  };

  const createRoom = async () => {
    if (!generatedCode) {
      setCreateError("Please generate a room code first");
      return;
    }

    if (!roomName.trim()) {
      setCreateError("Please enter a room name");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${burl}/api/room/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          roomId: generatedCode,
          name: roomName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create room");
      }

      router.push(
        `/room/?roomId=${generatedCode}&roomName=${encodeURIComponent(roomName)}`,
      );
    } catch (error) {
      console.error("Room creation error:", error);
      setCreateError(
        error instanceof Error ? error.message : "Failed to create room",
      );
    }
  };

  const joinRoom = async () => {
    setJoinError("");

    if (!roomCode || roomCode.length !== 5 || !/^\d+$/.test(roomCode)) {
      setJoinError("Please enter a valid 5-digit room code");
      return;
    }

    setIsJoining(true);

    try {
      const token = localStorage.getItem("token");

      const verifyResponse = await fetch(`${burl}/api/room/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          roomId: roomCode,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        console.error("Server error details:", errorData);
        throw new Error(
          errorData.error || "Room not found or no longer active",
        );
      }

      const roomData = await verifyResponse.json();
      const joinedRoomName =
        roomData.roomDetails?.slug ||
        roomData.roomDetails?.name ||
        `Room-${roomCode}`;

      router.push(
        `/room/?roomId=${roomCode}&roomName=${encodeURIComponent(joinedRoomName)}`,
      );
    } catch (error) {
      console.error("Room joining error:", error);
      setJoinError(
        error instanceof Error ? error.message : "Failed to join room",
      );
    } finally {
      setIsJoining(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this room? All messages will be lost.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${burl}/api/room/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete room");
      }

      setActiveRooms((prev) => prev.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Delete room error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete room");
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    router.push("/signin");
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Navbar with Logout */}
      <nav className="bg-neutral-800 border-b border-neutral-700 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">ChatApp</span>
          </div>
          <div className="flex items-center gap-4">
            {userName && (
              <span className="text-gray-300 text-sm hidden sm:inline">
                Hello, {userName}
              </span>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Welcome to your Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create Room Card */}
          <motion.div
            className="bg-neutral-800 rounded-xl overflow-hidden shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <PlusCircle className="text-blue-400" size={24} />
                <h3 className="text-xl font-bold">Create a Room</h3>
              </div>

              <p className="text-gray-400 mb-6">
                Generate a unique 5-digit code, customize your room name, and
                share it with others to join.
              </p>

              {createError && (
                <div className="mb-4 flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>{createError}</span>
                </div>
              )}

              <div className="mb-4">
                <Button
                  text={isGeneratingCode ? "Generating..." : "Generate Code"}
                  onClick={generateRoomCode}
                  className={`w-full mb-4 py-3 rounded-lg font-medium ${
                    isGeneratingCode
                      ? "bg-blue-600/50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 transition-colors"
                  }`}
                />

                {generatedCode && (
                  <motion.div
                    className="bg-neutral-700 p-4 rounded-lg mb-4 flex justify-between items-center"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  >
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        Your room code
                      </div>
                      <div className="text-2xl font-mono font-bold tracking-wider">
                        {generatedCode}
                      </div>
                    </div>
                    <button
                      onClick={copyCodeToClipboard}
                      className="p-2 bg-neutral-600 hover:bg-neutral-500 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {isCodeCopied ? (
                        <Check size={18} className="text-green-400" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </motion.div>
                )}

                {generatedCode && (
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Room Name
                    </label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="bg-neutral-700 w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Enter room name"
                      maxLength={30}
                    />
                    <div className="text-xs text-gray-400 mt-1 flex justify-between">
                      <span>Customize how your room appears to others</span>
                      <span>{roomName.length}/30</span>
                    </div>
                  </motion.div>
                )}

                <Button
                  text="Create & Enter Room"
                  onClick={createRoom}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                    !generatedCode
                      ? "bg-neutral-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-colors"
                  }`}
                />
              </div>
            </div>
          </motion.div>

          {/* Join Room Card */}
          <motion.div
            className="bg-neutral-800 rounded-xl overflow-hidden shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-emerald-400" size={24} />
                <h3 className="text-xl font-bold">Join a Room</h3>
              </div>

              <p className="text-gray-400 mb-6">
                Enter a 5-digit room code to join an existing conversation.
              </p>

              {joinError && (
                <div className="mb-4 flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} />
                  <span>{joinError}</span>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="bg-neutral-700 w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center text-2xl font-mono tracking-widest"
                  placeholder="00000"
                  maxLength={5}
                />
              </div>

              <Button
                text={isJoining ? "Joining..." : "Join Room"}
                onClick={joinRoom}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  isJoining
                    ? "bg-emerald-600/50 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 transition-colors"
                }`}
              />
            </div>
          </motion.div>
        </div>

        {/* Active Rooms Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Your Active Rooms</h3>
            <button
              onClick={fetchActiveRooms}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
              title="Refresh rooms"
            >
              <RefreshCcw size={18} />
            </button>
          </div>

          {activeRooms.length === 0 ? (
            <div className="bg-neutral-800 rounded-xl p-8 text-center">
              <Users className="mx-auto text-gray-600 mb-3" size={32} />
              <p className="text-gray-400">No active rooms yet.</p>
              <p className="text-gray-500 text-sm mt-1">
                Create or join a room to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.map((room) => (
                <motion.div
                  key={room.id}
                  className="bg-neutral-800 rounded-xl p-4 border border-neutral-700 hover:border-neutral-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/room/?roomId=${room.id}&roomName=${encodeURIComponent(room.slug || room.name)}`,
                        )
                      }
                    >
                      <h4 className="font-bold">{room.slug || room.name}</h4>
                      <p className="text-sm text-gray-400">Code: {room.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight size={18} className="text-gray-500" />
                      {/* Show delete button ONLY for admin */}
                      {room.admin === userId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRoom(room.id);
                          }}
                          className="p-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors"
                          title="Delete room"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
