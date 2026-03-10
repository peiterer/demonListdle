from flask import Flask

app = Flask(__name__)

@app.get("/")
def Home():
    return "welcome home"

if __name__ == "__main__":
    app.run(debug=True)