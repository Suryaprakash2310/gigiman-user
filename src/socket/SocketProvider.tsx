import React, { createContext, useContext, useEffect } from "react";
import { socket } from "./socket";
import { useAuthContext } from "@/src/context/AuthContext";

const SocketContext = createContext(socket);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthContext();

  useEffect(() => {
    if (!accessToken) {
      console.log("🔴 No token, disconnect socket");
      socket.disconnect();
      return;
    }

    console.log("🔌 Connecting socket...");

    socket.auth = { token: accessToken };

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      console.log("✅ Socket connected:", socket.id);
    };

    const onDisconnect = (reason: string) => {
      console.log("❌ Socket disconnected:", reason);
    };

    const onError = (err: any) => {
      console.log("⚠️ Socket error:", err.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);