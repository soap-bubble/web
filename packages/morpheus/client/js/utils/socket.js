import io from 'socket.io-client';

const socket = io(config.botHost);

export default new Promise((resolve) => {
  socket.on('connect', () => {
    const selfie = {
      emit: socket.emit.bind(socket),
      on: socket.on.bind(socket),
      token: '',
    };
    resolve(selfie);
  });
});
