const WebSocket = require('ws');
const Emitter = require('events');

class Client extends Emitter {
  constructor(ws, svcs, server) {
    super();
    this.socket = ws;
    this.authInfo = null;
    this.services = svcs;
    this.name = null;
    this.server = server;

    this.on('jwtSetReceived', ({ jwt }) => this.setJwt(jwt));
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
    this.name = this.authInfo.battletag;
  }

  toString() {
    return this.name;
  }
}

module.exports.handleWebsockets = function createServer(globalConfig, server, svcs, onConnection) {
  const wss = new WebSocket.Server({ server });


  // When connections come in, track
  wss.on('connection', (ws) => {
    const sock = new Client(ws, svcs, wss);

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
        ws.close();
        return;
      }

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

        sock.emit(`${op}Received`, msg);
      } catch (e) {
        sock.emit('deserializationError', e);
      }
    });

    ws.on('close', () => sock.emit('close'));
  });

  return wss;
};

function createCell(text) {
  return { text, isChecked: false };
}

function _(text) {
  return createCell(text);
}

module.exports.bindHandlers = function bindHandlers(config, sock) {
  const bingoCard = [

  ];

  for (let i = 0; i < 4; i += 1) {
    bingoCard[i] = [];
    for (let ii = 0; ii < 4; ii += 1) {
      const cellsCreated = (i * 4) + ii + 1;
      const cellText = config.bingo[cellsCreated - 1];
      let cell = cellText ? createCell(cellText) : null;
      if (!cell) {
        cell = createCell('');
        cell.isChecked = true;
      }
      bingoCard[i][ii] = cell;
    }
  }

  // eslint-disable-next-line no-param-reassign
  sock.bingoCard = bingoCard;

  sock.on('getUsersReceived', () => {
    const users = sock.getOtherUsers().map(otherSock => (
      { user: otherSock.name, card: otherSock.bingoCard }
    ));
    sock.send('connectedUsers', { users });
  });

  sock.on('getCardStateReceived', () => {
    sock.send('cardStateUpdate', { user: sock.name, bingoCard });
  });

  sock.on('updateCardStateReceived', (msg) => {
    const { col, row } = msg;

    try {
      bingoCard[col][row].isChecked = true;
    } catch (e) {
      // Do nothing
    }
    sock.broadcast('cardStateUpdate', { user: sock.name, bingoCard });
  });
};
