const net = require('node:net');
const { once } = require('node:events');

function port(value, name) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1 || result > 65535)
    throw new Error(`Port invalide : ${name}.`);
  return result;
}
async function available(portNumber) {
  // On Windows a bind probe alone can miss an existing wildcard/IPv6 listener.
  const busy = await Promise.all(
    ['127.0.0.1', '::1'].map(
      (host) =>
        new Promise((resolve) => {
          const socket = net.connect({ host, port: portNumber });
          const finish = (value) => {
            socket.destroy();
            resolve(value);
          };
          socket.setTimeout(750, () => finish(false));
          socket.once('connect', () => finish(true));
          socket.once('error', () => finish(false));
        }),
    ),
  );
  const message = `Le port ${portNumber} est déjà occupé. Arrête le service existant ou change les ports dans ton environnement.`;
  if (busy.some(Boolean)) throw new Error(message);
  const probe = net.createServer();
  try {
    probe.listen(portNumber, '127.0.0.1');
    await once(probe, 'listening');
    await new Promise((resolve) => probe.close(resolve));
  } catch {
    throw new Error(message);
  }
}
module.exports = { port, available };
