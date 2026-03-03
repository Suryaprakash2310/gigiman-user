import React, { createContext, useContext, useEffect } from "react";
import { socket } from "./socket";
import { useAuthContext } from "@/src/context/AuthContext";

const SocketContext = createContext(socket);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthContext();

  useEffect(() => {
    if (!accessToken) {
      socket.disconnect();
      return;
    }

    socket.auth = { token: accessToken };

    socket.connect();

    console.log("🔌 Connecting socket...");

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.log("⚠️ Socket error:", err.message);
    });

    return () => {
      socket.removeAllListeners(); // 🔥 prevents memory leak
      socket.disconnect();
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);