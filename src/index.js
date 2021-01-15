const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// when a client gets connected
io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    //sending an event to client
    // we use socket.emit to send message to specific user
    // io.emit is used to send message to all users
    // socket.emit('message', generateMessage("Welcome to chat application"))

    // sends messages to everbody except the current user
    // socket.broadcast.emit('message',generateMessage("A new user has joined!"))
    
    socket.on('join', ({username, room}, callback)=>{
        const {error, user } = addUser({id: socket.id, username, room})
        
        if(error) {
            return callback(error)
        }

        //messages will be emited to this specific room
        socket.join(user.room)
        
        socket.emit('message', generateMessage('Admin', `Welcome to chat application`))
        // everyone in the room except user
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // receiving message from client and relaying it to other clients
    socket.on('chatMessage', (message, callback)=>{
        const user = getUser(socket.id)

        const filter = new Filter()
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username,message))
        // acknowledgement
        callback()
    })

    //receiving location from client and sending it to all clients
    socket.on('location', (location, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,location))
        callback('Location delivered')
    })

    // inbuilt events
    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room:user.room,
                users: getUsersInRoom(user.room)
            })
        }

        
    })

})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})