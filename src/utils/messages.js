function generateMessage(text, username) {
  return {
    text,
    username,
    createdAt: new Date().getTime()
  }
}

function generateLocationMessage(coords, username) {
  return {
    coords,
    username,
    createdAt: new Date().getTime()
  }
}

module.exports = {
  generateMessage,
  generateLocationMessage
}
