import qs from 'query-string';

export default (function promiseSingleton() {
  let p;

  return () => {
    if (!p) {
      p = new Promise((resolve) => {
        const qp = qs.parse(location.search);

        if (qp.channel) {
          const socket = io(config.botHost);
          socket.on('connect', () => {
            const selfie = {
              emit: socket.emit.bind(socket),
              on: socket.on.bind(socket),
              token: '',
            };
            resolve(selfie);
          });
        }
      });
    }
    return p;
  };
}());
