const socket = io('http://localhost:8040');

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
