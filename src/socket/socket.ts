import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://10.31.162.29:5000"; // Replace with your backend URL

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,  // Disable automatic connection, we will connect manually
  transports: ["websocket"],
});
