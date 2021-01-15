//initializing the connection
const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight
  }
}

// receive an event from server
socket.on('message',(message) =>{
  console.log(message)
  // whenever someone sends message template should be rendered
  const html = Mustache.render(messageTemplate,{
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  // after rendering the template message is inserted in browser html
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('locationMessage', (message)=>{
  console.log(message)
  const html = Mustache.render(locationTemplate, {
    username:message.username,
    url: message.location,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})

socket.on('roomData', ({room, users})=> {
    const html = Mustache.render(sidebarTemplate, {
      room,
      users
  })
  document.querySelector('#sidebar').innerHTML = html
})

// sending message to server
document.querySelector('#message-form').addEventListener('submit', (e)=>{
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled','disabled')

    // const message = document.querySelector('input').value
    const message = e.target.elements.message.value
    socket.emit('chatMessage', message, (error) =>{

      $messageFormButton.removeAttribute('disabled')
      $messageFormInput.value = ''
      $messageFormInput.focus()
      
      // acknowledgement from server
      if(error){
        return console.log(error)
      }
      console.log('Message delivered')
    })
})

// sending location to server
document.querySelector('#send-location').addEventListener('click', ()=>{
  
  if(!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
  }

  $sendLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) =>{
     const location = `https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
     socket.emit('location', location, (message)=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log(message)
     })
  })
})

socket.emit('join', {username, room}, (error) =>{
   if(error) {
     alert(error)
     location.href = '/'
   }
})
