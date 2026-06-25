"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, MessageSquare } from "lucide-react";

export default function NavBar() {
  const router = useRouter();
  const userName =
    typeof window !== "undefined" ? localStorage.getItem("userName") : null;

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    router.push("/signin");
  };

  return (
    <nav className="bg-neutral-800 border-b border-neutral-700 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-blue-400" size={24} />
          <span className="text-white font-bold text-lg">ChatApp</span>
        </div>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-gray-300 text-sm hidden sm:inline">
              Hello, {userName}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
