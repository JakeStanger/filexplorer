import {
  MiddlewarePlugin,
  PluginManager,
  WebsocketPlugin,
} from '../../pluginManager.js';
import crypto from 'crypto';
import { renderPage } from '../../layoutManager.js';

const queries = {
  select: (roomId: string) =>
    `SELECT message FROM Scratchpad WHERE roomId='${roomId}'`,
  upsert: (roomId: string, message: string) =>
    `INSERT OR REPLACE INTO Scratchpad (roomId, message) VALUES ('${roomId}', '${message}')`,
};

const scratchpadRedirect: MiddlewarePlugin<'scratchpad'> = async ({ res }) => {
  const id = crypto.randomBytes(4).toString('base64url');
  res.redirect(`/_/scratch/${id}`);
};

const scratchpad: MiddlewarePlugin<'scratchpad'> = async ({
  req,
  res,
  ...params
}) => {
  const id = /\/(.*)/g.exec(req.path)?.[1];
  if (!id) {
    return scratchpadRedirect({
      req,
      res,
      ...params,
    });
  }

  const page = await renderPage('scratchpad', req.originalUrl, {});
  res.send(page);
};

const onScratchpadConnection: WebsocketPlugin<'scratchpad'> = async ({
  socket,
  io,
  db,
}) => {
  socket.on('join', async (roomId: string) => {
    await socket.join(roomId);
    const row = await db?.get(queries.select(roomId));
    if (row) {
      io.to(roomId).emit('scratchpad', row.message, null);
    }
  });

  socket.on('scratchpad', async (message, roomId) => {
    if (!roomId) return;
    socket.to(roomId).emit('scratchpad', message, socket.id);
    await db?.exec(queries.upsert(roomId, message));
  });
};

PluginManager.register('scratchpad')
  .withAppMiddleware(scratchpad, '/scratch')
  .withSocketIO(onScratchpadConnection)
  .withDatabaseTable('scratchpad', {
    roomId: 'TEXT PRIMARY KEY',
    message: "TEXT DEFAULT ''",
  });
