import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors());

const rooms = {};

app.post('/messages', (req, res) => {
  const { text, author, room = 'general' } = req.body;

  if (!rooms[room]) rooms[room] = [];

  const message = {
    text,
    author, // ✅ додано author
    time: new Date(),
    room,
  };

  rooms[room].push(message);

  for (const client of wss.clients) {
    if (client.room === room && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }

  res.status(201).send(rooms[room]);
});

app.get('/messages', (req, res) => {
  const { room = 'general' } = req.query;
  res.status(200).send(rooms[room] || []);
});

app.get('/rooms', (req, res) => {
  res.status(200).send(Object.keys(rooms));
});

app.post('/rooms', (req, res) => {
  const { name } = req.body;
  if (!rooms[name]) rooms[name] = [];
  res.status(201).send({ name });
});

app.patch('/rooms/:name', (req, res) => {
  const { name } = req.params;
  const { newName } = req.body;
  if (!rooms[name]) return res.status(404).send({ error: 'Room not found' });
  rooms[newName] = rooms[name];
  delete rooms[name];
  res.status(200).send({ name: newName });
});

app.delete('/rooms/:name', (req, res) => {
  const { name } = req.params;
  delete rooms[name];
  res.status(200).send({ deleted: name });
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (connection) => {
  connection.on('message', (data) => {
    const { text, author, room = 'general' } = JSON.parse(data);

    connection.room = room;

    if (!rooms[room]) rooms[room] = [];

    const message = {
      text,
      author, // ✅ додано author
      time: new Date(),
      room,
    };

    rooms[room].push(message);

    for (const client of wss.clients) {
      if (client.room === room && client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    }
  });

  connection.on('room_join', (room) => {
    connection.room = room;
    if (rooms[room]) {
      connection.send(JSON.stringify({ history: rooms[room] }));
    }
  });
});
