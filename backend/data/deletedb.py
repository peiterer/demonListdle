import mariadb, os

def getDbConn():
    return mariadb.connect(
        user="appuser",
        password="appsecret",
        host="127.0.0.1",
        port=3308,
        database="appdb"
    )

conn = getDbConn()
cur = conn.cursor()

cur.execute("DROP TABLE demons")
# cur.execute("SELECT * FROM demons")

# print(cur.fetchall())

conn.commit()
cur.close()

conn.close()