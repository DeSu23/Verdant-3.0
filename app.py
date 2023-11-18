from flask import Flask, render_template, request
from flask_socketio import SocketIO
import sqlite3
import os

app = Flask(__name__)
socketio = SocketIO(app)

DATABASE = 'chat.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    db = get_db()
    with app.open_resource('schema.sql') as f:
        db.executescript(f.read().decode('utf8'))
    db.commit()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def save_message(channel, message):
    db = get_db()
    db.execute('INSERT INTO messages (channel, message) VALUES (?, ?)', (channel, message))
    db.commit()

def get_channel_messages(channel):
    return query_db('SELECT message FROM messages WHERE channel = ?', [channel])

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('send_message')
def handle_send_message(data):
    if not data['message'].strip():
        return 
    channel = data['channel']
    message = "Stranger: " + data['message']

    save_message(channel, message)

    socketio.emit('receive_message', {'message': message, 'channel': channel})

@socketio.on('join_channel')
def handle_join_channel(data):
    channel = data['channel']
    messages = get_channel_messages(channel)
    messages = [msg['message'] for msg in messages]
    socketio.emit('load_messages', {'channel': channel, 'messages': messages}, room=request.sid)

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
