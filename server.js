const express = require("express")
const app = express()
const http = require("http").createServer(app)
const { Server } = require("socket.io")

const io = new Server(http,{
cors:{
origin:"*"
}
})

app.use(express.static("public"))
app.use(express.json())

/* server info */

const PORT = 3000

/* in-memory database */

let users = {}
let messages = []
let reactions = {}

/* home route */

app.get("/",(req,res)=>{
res.sendFile(__dirname + "/public/techno.html")
})

/* socket connection */

io.on("connection",(socket)=>{

console.log("User connected:",socket.id)

/* join server */

socket.on("join",(user)=>{

users[socket.id] = {
name:user.name,
avatar:user.avatar,
joined:Date.now()
}

socket.emit("chat history",messages)

io.emit("user list",Object.values(users).map(u=>u.name))

})

/* send message */

socket.on("chat message",(data)=>{

const msg = {
id: Date.now().toString(),
username:data.username,
avatar:data.avatar,
text:data.text,
reply:data.reply || null,
time:new Date().toLocaleTimeString()
}

messages.push(msg)

if(messages.length > 200){
messages.shift()
}

io.emit("chat message",msg)

})

/* reactions */

socket.on("reaction",(data)=>{

const {messageId,emoji,user} = data

if(!reactions[messageId]){
reactions[messageId] = []
}

reactions[messageId].push({
emoji:emoji,
user:user
})

io.emit("reaction update",{
messageId:messageId,
reactions:reactions[messageId]
})

})

/* typing indicator */

socket.on("typing",(user)=>{

socket.broadcast.emit("typing",user)

})

/* file or image */

socket.on("file message",(data)=>{

const msg = {
id:Date.now().toString(),
username:data.username,
avatar:data.avatar,
text:data.file,
type:"file",
time:new Date().toLocaleTimeString()
}

messages.push(msg)

io.emit("chat message",msg)

})

/* disconnect */

socket.on("disconnect",()=>{

console.log("User left:",socket.id)

delete users[socket.id]

io.emit("user list",Object.values(users).map(u=>u.name))

})

})

/* start server */

http.listen(PORT,()=>{

console.log("================================")
console.log("Techno Union Server Started")
console.log("Local: http://localhost:"+PORT)
console.log("================================")

})