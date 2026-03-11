from flask import Flask, request
import mariadb, os, json

app = Flask(__name__)
answer = None

def getDbConn():
    return mariadb.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME")
    )

def getRandomAnswer():
    conn = getDbConn()
    cur = conn.cursor()
    cur.execute("SELECT name FROM demons ORDER BY RAND() LIMIT 1")
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row[0] if row else None

conn = getDbConn()
cur = conn.cursor()

cur.execute("SET NAMES utf8mb4")
cur.execute("SET CHARACTER SET utf8mb4")

cur.execute("""
CREATE TABLE IF NOT EXISTS demons (
    id INT,
    name VARCHAR(255),
    position INT,
    creator VARCHAR(255),
    verifyer VARCHAR(255),
    thumbnail TEXT,
    downloads INT,
    length INT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
""")

cur.execute("ALTER TABLE demons CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
cur.execute("ALTER TABLE demons MODIFY name VARCHAR(255)")
cur.execute("ALTER TABLE demons MODIFY creator VARCHAR(255)")
cur.execute("ALTER TABLE demons MODIFY verifyer VARCHAR(255)")
cur.execute("ALTER TABLE demons MODIFY thumbnail TEXT")

cur.execute("SELECT COUNT(*) FROM demons")
count = cur.fetchone()[0]

if count == 0:
    with open("data/finaldata.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for i in data:
            cur.execute(
                """
                INSERT INTO demons
                (id, name, position, creator, verifyer, thumbnail, downloads, length)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    i.get("id"),
                    i.get("name"),
                    i.get("position"),
                    i.get("creator"),
                    i.get("verifyer"),
                    i.get("thumbnail"),
                    i.get("downloads"),
                    i.get("length"),
                ),
            )
    conn.commit()

cur.close()
conn.close()

answer = getRandomAnswer() or "Belladonna"

@app.get("/")
def Home():
    return "welcome home"

@app.get("/suggestions")
def Suggestions():
    query = (request.args.get("q") or "").strip()
    if len(query) < 1:
        return {"suggestions": []}

    conn = getDbConn()
    cur = conn.cursor()
    cur.execute(
        "SELECT name FROM demons WHERE name LIKE ? ORDER BY position ASC LIMIT 10",
        [f"{query}%"],
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return {"suggestions": [row[0] for row in rows]}

@app.post("/new-game")
def NewGame():
    global answer
    new_answer = getRandomAnswer()
    if not new_answer:
        return {"error": "Could not start a new game"}, 500

    answer = new_answer
    return {"status": "ok"}

@app.post("/guess")
def Guess():
    res = {}
    guess = request.form.get("guess")

    conn = getDbConn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM demons WHERE name LIKE ?", [guess])
    guessObj = cur.fetchone()
    cur.execute("SELECT * FROM demons WHERE name LIKE ?", [answer])
    ansObj = cur.fetchone()

    if guessObj is None:
        cur.close()
        conn.close()
        return {"error": "Demon not found"}, 404

    res["guess"] = guessObj

    res["hints"] = {}

    if guessObj[0] == ansObj[0]: res["hints"]["id"] = "correct"
    elif guessObj[0] < ansObj[0]: res["hints"]["id"] = "higher"
    else: res["hints"]["id"] = "lower"

    if guessObj[1] == ansObj[1]: res["hints"]["name"] = "correct"
    else: res["hints"]["name"] = "incorrect"

    if guessObj[2] == ansObj[2]: res["hints"]["position"] = "correct"
    elif guessObj[2] < ansObj[2]: res["hints"]["position"] = "higher"
    else: res["hints"]["position"] = "lower"

    if guessObj[3] == ansObj[3]: res["hints"]["creator"] = "correct"
    else: res["hints"]["creator"] = "incorrect"

    if guessObj[4] == ansObj[4]: res["hints"]["verifyer"] = "correct"
    else: res["hints"]["verifyer"] = "incorrect"

    if guessObj[5] == ansObj[5]: res["hints"]["thumbnail"] = "correct"
    else: res["hints"]["thumbnail"] = "incorrect"

    if guessObj[6] == ansObj[6]: res["hints"]["downloads"] = "correct"
    elif guessObj[6] < ansObj[6]: res["hints"]["downloads"] = "higher"
    else: res["hints"]["downloads"] = "lower"

    if guessObj[7] == ansObj[7]: res["hints"]["length"] = "correct"
    elif guessObj[7] < ansObj[7]: res["hints"]["length"] = "higher"
    else: res["hints"]["length"] = "lower"

    if guess.lower() == answer.lower():
        res["correct"] = True
    else:
        res["correct"] = False

    cur.close()
    conn.close()

    return res

# @app.get("/getdata")
# def TestDB():
#     conn = getDbConn()
#     cur = conn.cursor()
#     cur.execute("SELECT * FROM demons LIMIT 1")
#     row = cur.fetchone()
#     cur.close()
#     conn.close()

#     if row is None:
#         return {"status": "empty", "result": None}, 404
#     return {"status": "ok", "result": row}

if __name__ == "__main__":
    app.run(debug=True)