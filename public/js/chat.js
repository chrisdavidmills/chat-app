const socket = io();

// socket.on('countUpdated', (count) => {
//   console.log('The count has been updated:', count);
// })
//
// // increment the count number when the button is pressed
// const btn = document.querySelector('button');
// btn.addEventListener('click', () => {
//   console.log('clicked');
//   socket.emit('increment');
// });

const outputElem = document.querySelector('.output');
const form = document.querySelector('form');
const messageInput = document.querySelector('#message-input');
const messages = document.querySelector('.messages');
const roomName = document.querySelector('.room-name');
const usersList = document.querySelector('.users-list');

// templates
// const messageTemplate = document.querySelector('#message-template').innerHTML;

// Options

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true });

// socket chat logic

function displayStatusMessage(msg) {
  outputElem.textContent = msg;
  outputElem.className = 'output fade-in-06s';
  setTimeout(() => {
    outputElem.className = 'output fade-out-06s';
  }, 2000)
}

socket.on('deliver-status-message', (msg) => {
  const text = `${moment(msg.createdAt).format('HH:mm a')}: ${msg.text}`
  displayStatusMessage(text);
})

form.addEventListener('submit', (e) => {
  e.preventDefault();
  form.setAttribute('disabled','disabled');
  if(messageInput.value.trim() !== '') {
    socket.emit('send-chat-message', messageInput.value.trim(), (error) => {
      // acknowledgement callback
      if(error) {
        return console.log(error);
      }

      console.log('Message delivered');
    });
    form.removeAttribute('disabled');
    messageInput.value = '';
    messageInput.focus();
  }
})

socket.on('deliver-chat-message', (msg) => {
  const ddElem = document.createElement('dd');
  const dtElem = document.createElement('dt');
  const spanUser = document.createElement('span');
  const spanTime = document.createElement('span');
  spanUser.textContent = `${msg.username}:`;
  spanTime.textContent = moment(msg.createdAt).format('HH:mm a');
  ddElem.appendChild(spanUser);
  ddElem.appendChild(spanTime);
  dtElem.textContent = msg.text;
  messages.appendChild(ddElem);
  messages.appendChild(dtElem);

  // usage of mustache to render template, just for reference
  // in my example, this conflicts with the handlebars variable
  // syntax, so I can't use it
  //const html = Mustache.render(messageTemplate, {
  //  msg
  //});
  //messages.insertAdjacentHTML('beforeend', html);
})

// geolocation

const locationBtn = document.querySelector('#send-location');

locationBtn.addEventListener('click', () => {
  if(!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  locationBtn.setAttribute('disabled','disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('send-location', { lat: position.coords.latitude, long: position.coords.longitude }, (msg) => {
        displayStatusMessage(msg);
        locationBtn.removeAttribute('disabled');
    });
  })
});

socket.on('deliver-geo-message', (msg) => {
  const ddElem = document.createElement('dd');
  const dtElem = document.createElement('dt');
  const spanUser = document.createElement('span');
  const spanTime = document.createElement('span');

  const aElem = document.createElement('a');
  aElem.href = `https://www.google.co.uk/maps/@${msg.coords.lat},${msg.coords.long},14z`;
  aElem.textContent = 'See my location on a map';
  aElem.target = '_blank';

  spanUser.textContent = `${msg.username}:`;
  spanTime.textContent = moment(msg.createdAt).format('HH:mm a');
  ddElem.appendChild(spanUser);
  ddElem.appendChild(spanTime);
  dtElem.appendChild(aElem);
  messages.appendChild(ddElem);
  messages.appendChild(dtElem);
})

socket.on('room-data', ({ room, users }) => {
  roomName.textContent = `Room: ${room}`;
  usersList.replaceChildren();
  users.forEach((user) => {
    const listItem = document.createElement('li');
    listItem.textContent = user.username;
    usersList.appendChild(listItem);
  })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
