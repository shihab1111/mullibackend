import { Server, Socket } from "socket.io";

export const notificationSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    socket.on("join-notification", (userId: string) => {
      socket.join(`notification_${userId}`);
    });
    socket.on("leave-notification", (userId: string) => {
      socket.leave(`notification_${userId}`);
    });
    socket.on("disconnect", () => {
    });
  });
};
