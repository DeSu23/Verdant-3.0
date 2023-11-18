document.addEventListener('DOMContentLoaded', () => {
    const socket = io.connect(`${location.protocol}//${document.domain}:${location.port}`);
    const messageInput = document.querySelector('.message-bar input');
    const messagesDiv = document.querySelector('.messages');
    const contentHeader = document.querySelector('.content-header');
    const sidebar = document.querySelector('.sidebar');

    function sendMessage() {
        const message = messageInput.value;
        const channel = document.querySelector('.sidebar .channel.active').textContent.trim();
        socket.emit('send_message', { message, channel });
        messageInput.value = '';
    }

    function updateActiveChannel(channelElement) {
        sidebar.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));
        channelElement.classList.add('active');
        const channelName = channelElement.textContent.trim();
        contentHeader.textContent = channelName;
        socket.emit('join_channel', { channel: channelName });
    }

    function appendMessage(message) {
        const div = document.createElement('div');
        div.textContent = message;
        messagesDiv.appendChild(div);
    }

    socket.on('connect', () => {
        document.querySelector('.message-bar button').addEventListener('click', sendMessage);
        sidebar.addEventListener('click', event => {
            if (event.target.classList.contains('channel')) {
                updateActiveChannel(event.target);
            }
        });
    });

    socket.on('receive_message', data => {
        if (contentHeader.textContent.trim() === data.channel) {
            appendMessage(data.message);
        }
    });

    socket.on('load_messages', data => {
        messagesDiv.innerHTML = '';
        data.messages.forEach(appendMessage);
    });

    messageInput.addEventListener('keydown', function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    const logo = document.querySelector('.server-name img');
    logo.addEventListener('click', function () {
        if (!this.classList.contains('spinOnce')) {
            this.classList.add('spinOnce');
            setTimeout(() => this.classList.remove('spinOnce'), 1000);
        }
    });
});