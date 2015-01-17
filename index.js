var conf = {
    port: 3000,
    storage_deep: 5,
    member_lenth: 3
};

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('redis');
var client = redis.createClient();


server.listen(conf.port, function () {
    console.log('Server listening at port %d', conf.port);
});

client.on("error", function (err) {
    console.log("Error " + err);
});

// ***************************************************************************
// Express routes
// ***************************************************************************

app.use(express.static(__dirname + '/public'));

// ***************************************************************************
// Socket.io events
// ***************************************************************************

io.on('connection', function (socket) {

    var isRoomSet = false;

    socket.emit('get user id');

    socket.on('add user', function (user_id) {
        socket.user_id = user_id;
        socket.emit('user added', socket.id);
    });

    socket.on('switch room', function (room) {
        checkRoomSet();
        socket.room = room;
        socket.join(socket.room);
        socket.emit('room changed', socket.room);
        client.lrange(socket.room, 0, conf.member_lenth - 1, function (err, results) {
            err ? errLog(err) : socket.emit('load room history', results);
            emitNewMsg({
                socket: socket.id,
                username: 'system',
                message: 'user_id: "' + socket.user_id + '", on socket_id: "' + socket.id + '" is joined room "' + socket.room + '".'
            });
        });

    });

    socket.on('new message', function (msg) {
        emitNewMsg({
            socket: socket.id,
            username: socket.user_id,
            message: msg
        });
    });


    function emitNewMsg(data) {
        io.to(socket.room).emit('new message', data);
        client.lpush(socket.room, JSON.stringify(data));
        client.ltrim(socket.room, 0, conf.storage_deep - 1);
    }

    function checkRoomSet() {
        if (isRoomSet) {
            socket.leave(socket.room);
        } else {
            isRoomSet = true;
        }
    }

    function errLog(err) {
        console.log(err);
    }

});

