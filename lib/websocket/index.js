const WebSocket = require('ws');
const Emitter = require('events');
const randomSeed = require('random-seed');
const logger = require('../logging/logger-factory').getLogger('websocket');

class Client extends Emitter {
  constructor(ws, svcs, server) {
    super();
    this.socket = ws;
    this.authInfo = null;
    this.services = svcs;
    this.name = null;
    this.server = server;
    this.handlers = {};
  }

  setJwt(jwt) {
    let initializing = false;
    if (this.authInfo === null) {
      initializing = true;
    }

    try {
      this.authInfo = this.services.bnet.decodeJwt(jwt);
      this.setAuthInfo();
    } catch (e) {
      this.emit('error', e);
      return;
    }

    if (initializing) {
      this.emit('initialized');
    }
  }

  setUser(name) {
    let initializing = false;
    if (this.authInfo === null) {
      initializing = true;
    }

    try {
      this.authInfo = {
        common: {
          username: name,
        },
      };
      this.setAuthInfo();
    } catch (e) {
      this.emit('error', e);
      return;
    }

    if (initializing) {
      this.emit('initialized');
    }
  }

  op(event, cb) {
    if (this.handlers[event]) {
      throw new Error('Cannot re-register handler');
    }
    this.handlers[event] = cb;
  }

  handleMessage(event, msg) {
    const handler = this.handlers[event];

    if (!handler) {
      return false;
    }

    handler.call(this, msg);
    return true;
  }

  broadcast(event, obj) {
    this.server.clients.forEach((client) => {
      if (client.sock.name !== this.name) {
        client.sock.send(event, obj);
      }
    });
  }

  getOtherUsers() {
    const sockets = [];
    this.server.clients.forEach((client) => {
      if (client.sock.name !== this.name) {
        sockets.push(client.sock);
      }
    });
    return sockets;
  }

  send(event, obj) {
    this.socket.send(JSON.stringify({
      event,
      ...obj,
    }));
  }

  setAuthInfo() {
    this.name = this.authInfo.common.username;
  }

  toString() {
    return this.name;
  }
}

module.exports.handleWebsockets = function createServer(globalConfig, server, svcs, onConnection) {
  const wss = new WebSocket.Server({ server });

  // When connections come in, track
  wss.on('connection', (ws) => {
    let clientLogger = logger.child({ component: 'websocket' });
    const sock = new Client(ws, svcs, wss);

    sock.on('error', (e) => {
      clientLogger.error(e, 'Error in client');
    });

    // eslint-disable-next-line no-param-reassign
    ws.sock = sock;

    sock.once('initialized', () => {
      let foundUser = 0;
      sock.server.clients.forEach((client) => {
        if (client.sock.name === sock.name) {
          foundUser += 1;
        }
      });

      if (foundUser > 1) {
        sock.send('disconnect', { message: 'You are already connected' });
        ws.terminate();
        return;
      }

      clientLogger = clientLogger.child({ user: sock.name });

      sock.send('loggedIn', { user: sock.name });
      sock.broadcast('userLogIn', { user: sock.name });

      onConnection(sock);
    });

    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message);
        const { op } = msg;

        if (!op) {
          sock.emit('deserializationError', null, msg);
          return;
        }

        delete msg.op;

        clientLogger.info({ op }, 'Received new websocket message');

        if (!sock.handleMessage(op, msg)) {
          clientLogger.info({ op }, 'No registered handler for op');
        }
      } catch (e) {
        sock.emit('deserializationError', e);
        clientLogger.error(e, 'Deserialization error handling message');
        ws.terminate();
      }
    });

    ws.on('close', () => sock.emit('close'));

    // Special top level handlers
    sock.op('auth', ({ jwt }) => {
      clientLogger.info('User trying to log in...');
      try {
        sock.setJwt(jwt);
      } catch (e) {
        clientLogger.error(e, 'Error trying to log in with JWT');
      }
    });

    sock.op('fakeAuth', ({ name }) => {
      clientLogger.info({ name }, 'User trying to log in...');
      sock.setUser(name);
    });
  });

  return wss;
};

function createCell(text) {
  return { text, isChecked: false };
}

function getInitialCardState(config, username) {
  const gen = randomSeed.create(username);
  const bingoCard = [];

  const availableCellText = JSON.parse(JSON.stringify(config.bingo));

  for (let i = 0; i < 4; i += 1) {
    bingoCard[i] = [];
    for (let ii = 0; ii < 4; ii += 1) {
      const nextIndex = gen(availableCellText.length);
      const cellText = availableCellText.splice(nextIndex, 1);
      let cell = cellText ? createCell(cellText) : null;
      if (!cell) {
        cell = createCell('');
        cell.isChecked = true;
      }
      bingoCard[i][ii] = cell;
    }
  }

  return bingoCard;
}

module.exports.bindHandlers = function bindHandlers(config, sock) {
  const bingoCard = getInitialCardState(config, sock.name);

  // eslint-disable-next-line no-param-reassign
  sock.bingoCard = bingoCard;

  sock.op('getUsers', () => {
    const users = sock.getOtherUsers().map(otherSock => (
      { user: otherSock.name, card: otherSock.bingoCard }
    ));
    sock.send('connectedUsers', { users });
  });

  sock.op('getCardState', () => {
    sock.send('cardStateUpdate', { user: sock.name, bingoCard });
  });

  sock.op('updateCardState', (msg) => {
    const { col, row } = msg;

    try {
      bingoCard[col][row].isChecked = true;
    } catch (e) {
      // Do nothing
    }
    sock.broadcast('cardStateUpdate', { user: sock.name, bingoCard });
  });
};
