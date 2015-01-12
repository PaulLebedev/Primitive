// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var redis = require('redis');
var client = redis.createClient();




server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

client.on("error", function (err) {
    console.log("Error " + err);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
    var addedUser = false;
    var isRoomSet = false;
//    var redisReplay = '';

    /*function getRedisReplay(key) {
        client.get(key, function (err, reply) {
            if (err)
                console.log("Error " + err);
            console.log(reply);
            socket.replay = "Replay: " + reply;
            console.log(socket.replay);
        });
    }*/

    /*function statusMsg() {
     client.get("socket.IO_key", function (err, reply) {
     if (err)
     console.log("Error " + err);
     console.log(reply);
     socket.replay = "Replay: " + reply;
     console.log(socket.replay);
     io.to(socket.room).emit('new message', {
     username: 'system_' + socket.room,
     message: socket.username + ' is joined.' + socket.replay
     });
     });
     }*/

    function statusMsg() {
        io.to(socket.room).emit('new message', {
            username: 'system_' + socket.room,
            message: socket.username + ' is joined.'
        });
    }

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        io.to(socket.room).emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'new room', this listens and executes
    socket.on('new room', function (room) {
        if (isRoomSet) {
            socket.leave(socket.room);
        } else {
            isRoomSet = true;
        }
        // we store the room in the socket session for this client
        socket.room = room;
        socket.join(room);
        socket.emit('update current room', room);
        statusMsg();

    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username) {
        // we store the username in the socket session for this client
        socket.username = username;

        // add the client's username to the global list
        usernames[username] = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        io.to(socket.room).emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        io.to(socket.room).emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        io.to(socket.room).emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        if (addedUser) {
            delete usernames[socket.username];
            --numUsers;

            // echo globally that this client has left
            io.to(socket.room).emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});
