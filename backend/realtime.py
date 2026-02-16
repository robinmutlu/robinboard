socketio_instance = None


def init_realtime(socketio):
    global socketio_instance
    socketio_instance = socketio


def broadcast(event_name, payload):
    if socketio_instance is None:
        return
    socketio_instance.emit(event_name, payload)
