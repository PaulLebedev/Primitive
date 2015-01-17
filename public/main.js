$(function () {
    // Initialize varibles
    var $window = $(window);
    var $logArea = $('#log_area .messages');
    var $chatArea = $('#chat_area .messages');
    var $userId = $('#user_id');
    var $startRoom = $('#start_room');
    var $socketId = $('#socket_id');

    var $inputMessage = $('#input_message');
    var $roomDisplay = $('#room_display');
    var $roomSwitcher = $('#room_switcher');

    var connected = false;

    var socket = io();

    // ***************************************************************************
    // Socket events
    // ***************************************************************************

    socket.on('get user id', function () {
        socket.emit('add user', $userId.val());
    });

    socket.on('user added', function (socket_id) {
        $socketId.val(socket_id);
        socket.emit('switch room', $startRoom.val());
        connected = true;
        $roomSwitcher.removeAttr('disabled');
    });

    socket.on('room changed', function (room) {
        $roomDisplay.val(room);
        $('select#room_switcher option[value="' + room + '"]').attr('selected', 'selected');
    });

    socket.on('new message', function (data) {
        $logArea.append(msgHtml(data));
        $chatArea.append(msgHtml(data));
    });

    socket.on('load room history', function (data_array) {
        $chatArea.empty();
        data_array.forEach(function (data) {
            $chatArea.prepend(msgHtml(JSON.parse(data)));
        });
    });

    // ***************************************************************************
    // Click & Keyboard events
    // ***************************************************************************

    $window.keydown(function (event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $inputMessage.focus();
        }
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            sendMessage();
        }
    });

    // Focus input when clicking on the message input's border
    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    $roomSwitcher.change(function () {
        socket.emit('switch room', $roomSwitcher.val());
    });

    // ***************************************************************************
    // Helpers
    // ***************************************************************************

    function msgHtml(data) {
        liClass = 'not_my';
        if (data.username === 'system')
        {
            liClass = 'system';
        }
        else if (data.socket === $socketId.val())
        {
            liClass = 'my';
        }
        return '<li class="' + liClass + '"><span>' + data.username + ':</span> ' + data.message + '</li>';
    }

    function sendMessage() {
        var message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputMessage.val('');
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', message);
        }
    }

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).text();
    }
});
