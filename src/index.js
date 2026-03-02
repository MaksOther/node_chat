'use strict';

import express from 'express';
import cors from 'cors';
import { EventEmitter } from 'events';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors());

const emmiter = new EventEmitter();
const messages = [];

app.post('/messages', (req, res) => {
  const { text } = req.body;

  const message = {
    text,
    time: new Date(),
  };

  messages.push(message);
  emmiter.emit('message', message);
  res.status(201).send(messages);
});

app.get('/messages', (req, res) => {
  emmiter.once('message', (message) => {
    res.status(200).send(messages);
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (connection) => {
  connection.on('message', (text) => {
    const message = {
      text: text.toString(),
      time: new Date(),
    };

    messages.push(message);
    emmiter.emit('message', message);
  });
});

emmiter.on('message', (message) => {
  for (const client of wss.clients) {
    client.send(JSON.stringify(message));
  }
});
