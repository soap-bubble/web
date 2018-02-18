import socketio from 'socket.io';
import { Server } from 'http';

export default function (app) {
  const server = Server(app);
  socketio(server);
  return server;
}
