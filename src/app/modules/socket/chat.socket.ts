// app/modules/chat/chat.socket.ts
import { Server, Socket } from "socket.io";

export const chatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {

    socket.on("join-chat", (userId: string) => {
      if (!userId) return;
      socket.join(userId);

    });

    socket.on("leave-chat", (userId: string) => {
      if (!userId) return;
      socket.leave(userId);
    });
    
    socket.on("disconnect", () => {
    });
  });
};
