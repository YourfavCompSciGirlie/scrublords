from flask import Flask, render_template, request, jsonify, send_file
from flask_socketio import SocketIO
from flask_cors import CORS
import qrcode
import io
import random
import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory stores
users      = {}      # token → {phone, name}
bookings   = []      # list of booking dicts
queue_list = []      # pointers into bookings

# Utilities
def generate_slots():
    """Return 8 hrs of 30-min slots with random load."""
    base = datetime.datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)
    slots = []
    for i in range(16):
        t = (base + datetime.timedelta(minutes=30*i)).strftime("%H:%M")
        load = random.random()
        slots.append({"time": t, "load": load})
    return slots

def serialize_queue():
    return [
      {
        "code": b["code"],
        "time": b["time"],
        "status": b["status"],
        "priority": b["priority"]
      }
      for b in queue_list
    ]

# Routes
@app.route("/")
def root():
    return render_template("login.html")

@app.route("/patient")
def patient_page():
    return render_template("patient.html")

@app.route("/staff")
def staff_page():
    return render_template("staff.html")


# API — Auth
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    phone = data["phone"]
    token = phone  # simplistic token
    users[token] = {"phone": phone, "name": data["name"]}
    return jsonify({"status":"ok", "token": token})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    phone = data["phone"]
    if phone in users:
        return jsonify({"status":"ok", "token": phone})
    return jsonify({"status":"error", "message":"Not found"}), 404


# API → Slots & Forecast
@app.route("/api/slots")
def slots():
    return jsonify(generate_slots())

@app.route("/api/forecast")
def forecast():
    # stubbed advisory
    return jsonify({
      "alert": "90% capacity at 09:30",
      "suggest": "10:00"
    })


# API → Booking
@app.route("/api/book", methods=["POST"])
def book():
    token = request.headers.get("Authorization")
    user = users.get(token)
    if not user:
        return jsonify({"status":"error"}), 401

    data = request.json
    code = f"P{len(bookings)+1:03d}"
    booking = {
      "code": code,
      "phone": user["phone"],
      "time": data["time"],
      "reason": data["reason"],
      "priority": data.get("priority", False),
      "status": "waiting"
    }
    bookings.append(booking)
    queue_list.append(booking)
    socketio.emit("queue_update", serialize_queue())
    return jsonify({"status":"ok","code":code})


# API → Queue & Staff actions
@app.route("/api/queue")
def get_queue():
    return jsonify(serialize_queue())

@app.route("/api/staff/arrive", methods=["POST"])
def arrive():
    code = request.json["code"]
    for b in queue_list:
        if b["code"] == code:
            b["status"] = "in-service"
    socketio.emit("queue_update", serialize_queue())
    return jsonify({"status":"ok"})

@app.route("/api/staff/complete", methods=["POST"])
def complete():
    code = request.json["code"]
    for b in queue_list:
        if b["code"] == code:
            b["status"] = "completed"
    # remove completed from queue
    global queue_list
    queue_list = [b for b in queue_list if b["status"]!="completed"]
    socketio.emit("queue_update", serialize_queue())
    return jsonify({"status":"ok"})


# API → QR token image (offline-mode)
@app.route("/api/token_qr/<code>")
def token_qr(code):
    img = qrcode.make(code)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return send_file(buf, mimetype="image/png")


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
