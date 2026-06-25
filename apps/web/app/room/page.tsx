"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  LogOut,
  X,
  Users,
  MessageCircle,
  ArrowLeft,
  Menu,
  Info,
  Copy,
  Check,
  Pencil,
} from "lucide-react";

interface Message {
  id: string;
  message: string;
  from: string;
  senderId: string;
  time: string;
  isSystem?: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  isOnline?: boolean;
}

function RoomContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [roomName, setRoomName] = useState("Chat Room");
  const [roomId, setRoomId] = useState("12345");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("user1");
  const [userName, setUserName] = useState("Demo User");
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [showDrawBoard, setShowDrawBoard] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserName = localStorage.getItem("userName");
    const roomIdParam = searchParams.get("roomId");
    const roomNameParam = searchParams.get("roomName");

    if (storedUserId) setUserId(storedUserId);
    if (storedUserName) setUserName(storedUserName);
    if (roomIdParam) setRoomId(roomIdParam);
    if (roomNameParam) setRoomName(decodeURIComponent(roomNameParam));

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!userId || !roomId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_BACKEND || "ws://localhost:8080";

    try {
      ws.current = new WebSocket(wsUrl);
    } catch (err) {
      setError(
        "Failed to connect to chat server. Please check your connection.",
      );
      return;
    }

    ws.current.onopen = () => {
      setIsConnected(true);
      setError(null);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            command: "connect",
            userId,
            userName,
            token: localStorage.getItem("token"),
          }),
        );

        setTimeout(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(
              JSON.stringify({
                command: "joinRoom",
                userId,
                roomId,
                token: localStorage.getItem("token"),
              }),
            );
          }
        }, 500);
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.type === "message_sent") {
          // Message delivered confirmation - update temp message status
          setIsMessageSending(false);
          return;
        }
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        if (data.type === "room_joined") {
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
          if (data.roomName) setRoomName(data.roomName);
          if (data.users) setUsers(data.users);
          return;
        }
        if (data.message) {
          const newMessage: Message = {
            id: data.id || Math.random().toString(36).substring(2, 9),
            message: data.message,
            from: data.from || "Unknown",
            senderId: data.senderId || "",
            time: data.time || new Date().toLocaleTimeString(),
            isSystem: data.isSystem || data.from === "System" || !data.from,
          };
          setMessages((prev) => [...prev, newMessage]);
        }

        if (data.roomName) setRoomName(data.roomName);
        if (data.users) setUsers(data.users);
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    ws.current.onerror = () => {
      setError(
        "Failed to connect to chat server. Please try refreshing the page.",
      );
    };

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [userId, userName, roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!messageInput.trim() || !isConnected || !roomId) return;
    if (ws.current?.readyState === WebSocket.OPEN) {
      setIsMessageSending(true);
      ws.current.send(
        JSON.stringify({
          command: "message",
          userId,
          roomId,
          msg: messageInput.trim(),
          token: localStorage.getItem("token"),
        }),
      );
      setMessageInput("");
    } else {
      setError("Connection to chat server lost. Please refresh the page.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const leaveRoom = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          command: "leaveRoom",
          userId,
          roomId,
          token: localStorage.getItem("token"),
        }),
      );
      ws.current.close();
      ws.current = null;
    }
    router.push("/dashboard");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 3000);
  };

  const signOut = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    router.push("/signin");
  };

  return (
    <div className="flex h-screen bg-neutral-900 text-white">
      <div className="flex flex-col w-full h-full overflow-hidden">
        <header className="bg-neutral-800 shadow-md py-3 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg hover:bg-neutral-700 mr-3 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg flex items-center">
                <MessageCircle className="text-green-400 mr-2" size={20} />
                {roomName}
              </h1>
              <div className="text-xs text-gray-400 flex items-center">
                <span
                  className={isConnected ? "text-green-400" : "text-red-400"}
                >
                  {isConnected ? "● Connected" : "● Disconnected"}
                </span>
                <span className="mx-2">|</span>
                <span>Room Code: {roomId}</span>
                <button
                  onClick={copyRoomCode}
                  className="ml-2 text-gray-400 hover:text-white"
                  title="Copy room code"
                >
                  {isCodeCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={leaveRoom}
              className="text-sm bg-neutral-700 hover:bg-neutral-600 py-1.5 px-3 rounded-lg flex items-center gap-1"
              title="Leave room"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Leave</span>
            </button>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                <User size={16} />
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-900/40 border-b border-red-500/30 px-4 py-2 text-red-200 text-sm flex items-center gap-2">
            <Info size={16} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={14} />
            </button>
          </div>
        )}

        {showDrawBoard ? (
          <div className="flex-1 relative">
            <button
              onClick={() => setShowDrawBoard(false)}
              className="absolute top-4 right-4 bg-neutral-800 hover:bg-neutral-700 p-2 rounded-full shadow-lg z-10"
              title="Return to chat"
            >
              <MessageCircle size={20} />
            </button>
          </div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto py-4 px-4 space-y-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageCircle
                      className="mx-auto text-gray-600 mb-3"
                      size={32}
                    />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === userId ? "justify-end" : "justify-start"
                    }`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm
                        ${
                          msg.isSystem
                            ? "bg-neutral-700/50 text-gray-300 text-center w-full max-w-full"
                            : msg.senderId === userId
                              ? "bg-blue-600"
                              : "bg-neutral-700"
                        }
                      `}
                    >
                      {!msg.isSystem && msg.senderId !== userId && (
                        <div className="font-medium text-xs text-gray-300">
                          {msg.from}
                        </div>
                      )}
                      <div className="break-words">{msg.message}</div>
                      <div className="text-xs opacity-60 mt-1 text-right">
                        {msg.time}
                      </div>
                    </motion.div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-neutral-800 border-t border-neutral-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-neutral-700 text-white placeholder-gray-400 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isConnected}
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    !messageInput.trim() || !isConnected || isMessageSending
                  }
                  className={`p-2.5 rounded-lg transition-colors ${
                    messageInput.trim() && isConnected && !isMessageSending
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-neutral-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-neutral-900 text-white items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading room...</p>
          </div>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
