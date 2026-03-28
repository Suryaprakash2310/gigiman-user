import React, { createContext, useContext, useEffect } from "react";
import { socket } from "./socket";
import { useAuthContext } from "@/src/context/AuthContext";

const SocketContext = createContext(socket);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthContext();

  useEffect(() => {
    if (!accessToken) {
      console.log("🔴 No token → cleaning socket");

      socket.removeAllListeners(); // 🔥 critical
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
      console.log(`❌ Socket disconnected: ${reason}`);
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      } else if (reason === "transport close" || reason === "ping timeout") {
        console.log("🔄 Auto-reconnecting socket in 3s...");
        setTimeout(() => {
          if (!socket.connected) {
            socket.connect();
          }
        }, 3000);
      }
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