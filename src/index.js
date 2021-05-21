const path = require('path');
const express = require('express');
const hbs = require('hbs');
const socketio = require('socket.io');
const Filter = require('bad-words'),
    filter = new Filter();
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const port = process.env.PORT || 7991;

const app = express();

// Slightly different server setup for socket.io usage; need the explicit server value to be available
const http = require('http');
const server = http.createServer(app);
const io = socketio(server);

app.set('view engine', 'hbs');

// Set custom views directory
const viewsPath = path.join(__dirname, '../templates/views');
app.set('views', viewsPath);

// Set partials directory
const partialsPath = path.join(__dirname, '../templates/partials');
hbs.registerPartials(partialsPath);

// set up static (public) directory; this is needed for any static files to be served, like images, your CSS, etc.
app.use(express.static(path.join(__dirname, '../public')));


app.get('/', (req, res) => {
  res.render('index', {
    title: 'Join chat'
  })
})

app.get('/chat', (req, res) => {
  res.render('chat', {
    title: 'Chat app'
  })
})

// send the count number to each client that connects
// let count = 0;

// AVAILABLE METHODS FOR EMITTING MESSAGES
// GENERAL MESSAGES: socket.emit(), io.emit(), socket.broadcast.emit()
// ROOM-SPECIFIC MESSAGES: io.to(room-name).emit(), socket.broadcast.to(room-name).emit()

io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    console.log(options);

    if(error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('deliver-status-message', generateMessage(`You are now connected to ${user.room}`));
    // send message to everyone in the room except the sender
    socket.broadcast.to(user.room).emit('deliver-chat-message', generateMessage(`${user.username} has joined`, user.username))
    io.to(user.room).emit('room-data', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();
  })

  socket.on('send-chat-message', (msg, callback) => {
    const user = getUser(socket.id);
    if(filter.isProfane(msg)) {
      return callback('Please do not submit bad language on this chat.');
    }
    io.to(user.room).emit('deliver-chat-message', generateMessage(msg, user.username));
    callback();
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('deliver-chat-message', generateMessage(`${user.username} has left the chat`, user.username));
      io.to(user.room).emit('room-data', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })

  // geolocation

  socket.on('send-location', (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('deliver-geo-message', generateLocationMessage(coords, user.username))
    callback('Location shared!');
  })
  // socket.emit('countUpdated', count);
  //
  // socket.on('increment', () => {
  //   count++;
  //   //only to that socket - socket.emit('countUpdated', count);
  //   io.emit('countUpdated', count); // to every available socket
  // })
});

server.listen(port, () => {
  console.log(`App running on port ${port}`);
})
