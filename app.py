import os, sqlite3, hashlib, random
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ─────────────────────────────────────────────────────────────────────────────
# PURE-PYTHON HUNGARIAN ALGORITHM
# Replaces scipy.optimize.linear_sum_assignment — zero compiled deps
# ─────────────────────────────────────────────────────────────────────────────
def hungarian(cost_matrix):
    """
    Munkres / Hungarian algorithm.
    Returns (row_indices, col_indices) of the optimal assignment,
    identical interface to scipy.optimize.linear_sum_assignment.
    """
    import copy
    C = [row[:] for row in cost_matrix]          # deep copy
    n = len(C)
    # Pad to square if needed
    for row in C:
        while len(row) < n:
            row.append(0)

    # Step 1 – row reduction
    for i in range(n):
        mn = min(C[i])
        C[i] = [v - mn for v in C[i]]

    # Step 2 – column reduction
    for j in range(n):
        mn = min(C[i][j] for i in range(n))
        for i in range(n):
            C[i][j] -= mn

    # Steps 3-6 – cover zeros and adjust
    assignment = [-1] * n
    for _ in range(n):
        # Find uncovered zeros and try to assign
        covered_rows = set()
        covered_cols = set()
        starred = [[False]*n for _ in range(n)]
        primed  = [[False]*n for _ in range(n)]

        # Star a zero in each row if possible
        col_starred = [-1] * n
        row_starred = [-1] * n
        for i in range(n):
            for j in range(n):
                if C[i][j] == 0 and row_starred[i] == -1 and col_starred[j] == -1:
                    starred[i][j]  = True
                    row_starred[i] = j
                    col_starred[j] = i

        for _ in range(n * n):
            # Cover cols with starred zeros
            covered_cols = {j for j in range(n) if col_starred[j] != -1}
            if len(covered_cols) >= n:
                break

            # Find uncovered zero
            z = None
            for i in range(n):
                if i in covered_rows:
                    continue
                for j in range(n):
                    if j not in covered_cols and C[i][j] == 0:
                        z = (i, j)
                        break
                if z:
                    break

            if z is None:
                # Adjust matrix
                mn = min(
                    C[i][j]
                    for i in range(n) if i not in covered_rows
                    for j in range(n) if j not in covered_cols
                )
                for i in range(n):
                    for j in range(n):
                        if i in covered_rows:
                            C[i][j] += mn
                        if j not in covered_cols:
                            C[i][j] -= mn
                continue

            zi, zj = z
            primed[zi][zj] = True
            sc = row_starred[zi]     # starred zero in same row?
            if sc != -1:
                covered_rows.add(zi)
                covered_cols.discard(sc)
            else:
                # Augmenting path
                path = [(zi, zj)]
                while True:
                    sr = col_starred[path[-1][1]]
                    if sr == -1:
                        break
                    path.append((sr, path[-1][1]))
                    pc = next(j for j in range(n) if primed[sr][j])
                    path.append((sr, pc))
                for pi, pj in path:
                    if starred[pi][pj]:
                        starred[pi][pj]  = False
                        row_starred[pi]  = -1
                        col_starred[pj]  = -1
                    else:
                        starred[pi][pj]  = True
                        row_starred[pi]  = pj
                        col_starred[pj]  = pi
                covered_rows.clear()
                primed = [[False]*n for _ in range(n)]

        assignment = row_starred
        break

    rows = list(range(n))
    cols = [assignment[i] if assignment[i] != -1 else i for i in range(n)]
    return rows, cols


# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DB_PATH    = os.environ.get("DATABASE_URL", os.path.join("/tmp", "cloud.db"))

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")

if os.environ.get("FLASK_ENV") == "development":
    CORS(app)
else:
    CORS(app, origins=[os.environ.get("RENDER_EXTERNAL_URL", "*")])

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT UNIQUE NOT NULL,
            email      TEXT UNIQUE NOT NULL,
            password   TEXT NOT NULL,
            role       TEXT DEFAULT 'user',
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS physical_machines (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            cpu        INTEGER NOT NULL,
            ram        INTEGER NOT NULL,
            storage    INTEGER NOT NULL,
            status     TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS virtual_machines (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            pm_id         INTEGER,
            vm_name       TEXT NOT NULL,
            cpu_allocated INTEGER NOT NULL,
            ram_allocated INTEGER NOT NULL,
            status        TEXT DEFAULT 'idle',
            created_at    TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(pm_id) REFERENCES physical_machines(id)
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            task_name    TEXT NOT NULL,
            cpu_required INTEGER NOT NULL,
            ram_required INTEGER NOT NULL,
            priority     INTEGER DEFAULT 3,
            status       TEXT DEFAULT 'pending',
            created_at   TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS allocations (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id         INTEGER,
            vm_id           INTEGER,
            allocation_cost REAL,
            response_time   REAL,
            allocated_at    TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(task_id) REFERENCES tasks(id),
            FOREIGN KEY(vm_id)   REFERENCES virtual_machines(id)
        );
        CREATE TABLE IF NOT EXISTS qos_metrics (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            throughput          REAL,
            latency             REAL,
            cpu_utilization     REAL,
            memory_utilization  REAL,
            recorded_at         TEXT DEFAULT (datetime('now'))
        );
        """)
        pw = hashlib.sha256("admin123".encode()).hexdigest()
        db.execute(
            "INSERT OR IGNORE INTO users(username,email,password,role) VALUES(?,?,?,?)",
            ("admin","admin@cloud.sim",pw,"admin")
        )
        for name, cpu, ram, storage in [("PM-Alpha",16,32768,500),("PM-Beta",32,65536,1000),("PM-Gamma",8,16384,250)]:
            db.execute(
                "INSERT OR IGNORE INTO physical_machines(name,cpu,ram,storage) VALUES(?,?,?,?)",
                (name,cpu,ram,storage)
            )
        for pm_id,vm_name,cpu,ram in [(1,"VM-001",4,8192),(1,"VM-002",4,8192),(2,"VM-003",8,16384),(2,"VM-004",8,16384),(3,"VM-005",2,4096)]:
            db.execute(
                "INSERT OR IGNORE INTO virtual_machines(pm_id,vm_name,cpu_allocated,ram_allocated) VALUES(?,?,?,?)",
                (pm_id,vm_name,cpu,ram)
            )
        for task_name,cpu,ram,priority in [("Task-Web-01",2,2048,3),("Task-DB-01",4,8192,5),("Task-ML-01",8,16384,1),("Task-API-01",2,4096,4)]:
            db.execute(
                "INSERT OR IGNORE INTO tasks(task_name,cpu_required,ram_required,priority) VALUES(?,?,?,?)",
                (task_name,cpu,ram,priority)
            )
        db.commit()

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def hash_pw(pw):   return hashlib.sha256(pw.encode()).hexdigest()
def rows(rs):      return [dict(r) for r in rs]

def record_qos():
    with get_db() as db:
        db.execute(
            "INSERT INTO qos_metrics(throughput,latency,cpu_utilization,memory_utilization) VALUES(?,?,?,?)",
            (round(random.uniform(100,500),2), round(random.uniform(5,80),2),
             round(random.uniform(40,85),2),   round(random.uniform(35,75),2))
        )
        db.commit()

# ─────────────────────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.json
    try:
        with get_db() as db:
            db.execute("INSERT INTO users(username,email,password) VALUES(?,?,?)",
                       (d["username"],d["email"],hash_pw(d["password"])))
            db.commit()
        return jsonify({"ok":True,"msg":"Registered successfully"})
    except Exception as e:
        return jsonify({"ok":False,"msg":str(e)}), 400

@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.json
    with get_db() as db:
        user = db.execute("SELECT * FROM users WHERE username=? AND password=?",
                          (d["username"],hash_pw(d["password"]))).fetchone()
    if user:
        u = dict(user); u.pop("password",None)
        return jsonify({"ok":True,"user":u})
    return jsonify({"ok":False,"msg":"Invalid credentials"}), 401

# ─────────────────────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/dashboard")
def dashboard():
    record_qos()
    with get_db() as db:
        return jsonify({
            "pms":         db.execute("SELECT COUNT(*) as c FROM physical_machines").fetchone()["c"],
            "vms":         db.execute("SELECT COUNT(*) as c FROM virtual_machines").fetchone()["c"],
            "tasks":       db.execute("SELECT COUNT(*) as c FROM tasks").fetchone()["c"],
            "allocations": db.execute("SELECT COUNT(*) as c FROM allocations").fetchone()["c"],
            "pending":     db.execute("SELECT COUNT(*) as c FROM tasks WHERE status='pending'").fetchone()["c"],
            "completed":   db.execute("SELECT COUNT(*) as c FROM tasks WHERE status='completed'").fetchone()["c"],
            "qos": rows(db.execute("SELECT * FROM qos_metrics ORDER BY id DESC LIMIT 10").fetchall()),
            "recent_allocations": rows(db.execute("""
                SELECT a.*, t.task_name, v.vm_name
                FROM allocations a
                JOIN tasks t ON a.task_id=t.id
                JOIN virtual_machines v ON a.vm_id=v.id
                ORDER BY a.id DESC LIMIT 5
            """).fetchall()),
        })

# ─────────────────────────────────────────────────────────────────────────────
# PHYSICAL MACHINES
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/pm", methods=["GET"])
def get_pms():
    with get_db() as db:
        return jsonify(rows(db.execute("SELECT * FROM physical_machines ORDER BY id DESC").fetchall()))

@app.route("/api/pm", methods=["POST"])
def create_pm():
    d = request.json
    with get_db() as db:
        db.execute("INSERT INTO physical_machines(name,cpu,ram,storage,status) VALUES(?,?,?,?,?)",
                   (d["name"],int(d["cpu"]),int(d["ram"]),int(d["storage"]),d.get("status","active")))
        db.commit()
    return jsonify({"ok":True})

@app.route("/api/pm/<int:pid>", methods=["PUT"])
def update_pm(pid):
    d = request.json
    with get_db() as db:
        db.execute("UPDATE physical_machines SET name=?,cpu=?,ram=?,storage=?,status=? WHERE id=?",
                   (d["name"],int(d["cpu"]),int(d["ram"]),int(d["storage"]),d.get("status","active"),pid))
        db.commit()
    return jsonify({"ok":True})

@app.route("/api/pm/<int:pid>", methods=["DELETE"])
def delete_pm(pid):
    with get_db() as db:
        db.execute("DELETE FROM physical_machines WHERE id=?", (pid,))
        db.commit()
    return jsonify({"ok":True})

# ─────────────────────────────────────────────────────────────────────────────
# VIRTUAL MACHINES
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/vm", methods=["GET"])
def get_vms():
    with get_db() as db:
        return jsonify(rows(db.execute("""
            SELECT v.*, p.name as pm_name FROM virtual_machines v
            LEFT JOIN physical_machines p ON v.pm_id=p.id
            ORDER BY v.id DESC
        """).fetchall()))

@app.route("/api/vm", methods=["POST"])
def create_vm():
    d = request.json
    with get_db() as db:
        db.execute("INSERT INTO virtual_machines(pm_id,vm_name,cpu_allocated,ram_allocated,status) VALUES(?,?,?,?,?)",
                   (int(d["pm_id"]),d["vm_name"],int(d["cpu_allocated"]),int(d["ram_allocated"]),"idle"))
        db.commit()
    return jsonify({"ok":True})

@app.route("/api/vm/<int:vid>", methods=["PUT"])
def update_vm(vid):
    d = request.json
    with get_db() as db:
        db.execute("UPDATE virtual_machines SET vm_name=?,cpu_allocated=?,ram_allocated=?,status=? WHERE id=?",
                   (d["vm_name"],int(d["cpu_allocated"]),int(d["ram_allocated"]),d.get("status","idle"),vid))
        db.commit()
    return jsonify({"ok":True})

@app.route("/api/vm/<int:vid>", methods=["DELETE"])
def delete_vm(vid):
    with get_db() as db:
        db.execute("DELETE FROM virtual_machines WHERE id=?", (vid,))
        db.commit()
    return jsonify({"ok":True})

@app.route("/api/vm/reset", methods=["POST"])
def reset_vms():
    with get_db() as db:
        db.execute("UPDATE virtual_machines SET status='idle'")
        db.commit()
    return jsonify({"ok":True})

# ─────────────────────────────────────────────────────────────────────────────
# TASKS
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    with get_db() as db:
        return jsonify(rows(db.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()))

@app.route("/api/tasks", methods=["POST"])
def create_task():
    d = request.json
    with get_db() as db:
        db.execute("INSERT INTO tasks(task_name,cpu_required,ram_required,priority,status) VALUES(?,?,?,?,?)",
                   (d["task_name"],int(d["cpu_required"]),int(d["ram_required"]),int(d.get("priority",3)),"pending"))
        db.commit()
    return jsonify({"ok":True})

@app.route("/api/tasks/<int:tid>", methods=["DELETE"])
def delete_task(tid):
    with get_db() as db:
        db.execute("DELETE FROM tasks WHERE id=?", (tid,))
        db.commit()
    return jsonify({"ok":True})

# ─────────────────────────────────────────────────────────────────────────────
# HUNGARIAN ALGORITHM — HABBP ALLOCATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/allocate", methods=["POST"])
def allocate():
    with get_db() as db:
        pending_tasks = rows(db.execute("SELECT * FROM tasks WHERE status='pending'").fetchall())
        idle_vms      = rows(db.execute("SELECT * FROM virtual_machines WHERE status='idle'").fetchall())

    if not pending_tasks:
        return jsonify({"ok":False,"msg":"No pending tasks to allocate"}), 400
    if not idle_vms:
        return jsonify({"ok":False,"msg":"No idle VMs available — reset VMs first"}), 400

    n_t, n_v = len(pending_tasks), len(idle_vms)
    size = max(n_t, n_v)

    # Build cost matrix — lower cost = better fit
    BIG = 1_000_000.0
    cost = [[BIG]*size for _ in range(size)]
    for i, t in enumerate(pending_tasks):
        for j, v in enumerate(idle_vms):
            cpu_penalty    = max(0, t["cpu_required"] - v["cpu_allocated"]) * 15
            ram_penalty    = max(0, t["ram_required"] - v["ram_allocated"]) / 1024 * 5
            priority_w     = (6 - t["priority"]) * 10   # high priority → lower cost
            noise          = random.uniform(0.1, 2.0)
            cost[i][j]     = cpu_penalty + ram_penalty + priority_w + noise

    # Scale to integers for pure-python Hungarian (multiply by 1000, round)
    scale = 1000
    int_cost = [[int(cost[i][j]*scale) for j in range(size)] for i in range(size)]

    row_ind, col_ind = hungarian(int_cost)

    results = []
    with get_db() as db:
        for r, c in zip(row_ind, col_ind):
            if r < n_t and c < n_v:
                t, v          = pending_tasks[r], idle_vms[c]
                alloc_cost    = round(cost[r][c], 4)
                response_time = round(random.uniform(5, 80), 2)
                db.execute(
                    "INSERT INTO allocations(task_id,vm_id,allocation_cost,response_time) VALUES(?,?,?,?)",
                    (t["id"],v["id"],alloc_cost,response_time)
                )
                db.execute("UPDATE tasks SET status='completed' WHERE id=?", (t["id"],))
                db.execute("UPDATE virtual_machines SET status='busy' WHERE id=?", (v["id"],))
                results.append({"task":t["task_name"],"vm":v["vm_name"],
                                 "cost":alloc_cost,"response_time":response_time})
        db.commit()

    return jsonify({"ok":True,"allocations":results,"total":len(results)})

# ─────────────────────────────────────────────────────────────────────────────
# QOS & ALLOCATIONS HISTORY
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/qos")
def get_qos():
    with get_db() as db:
        return jsonify(rows(db.execute("SELECT * FROM qos_metrics ORDER BY id DESC LIMIT 20").fetchall()))

@app.route("/api/allocations")
def get_allocations():
    with get_db() as db:
        return jsonify(rows(db.execute("""
            SELECT a.*, t.task_name, t.priority, v.vm_name
            FROM allocations a
            JOIN tasks t ON a.task_id=t.id
            JOIN virtual_machines v ON a.vm_id=v.id
            ORDER BY a.id DESC LIMIT 50
        """).fetchall()))

# ─────────────────────────────────────────────────────────────────────────────
# STATIC / SPA FALLBACK
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/", defaults={"path":""})
@app.route("/<path:path>")
def serve_spa(path):
    full = os.path.join(app.static_folder, path)
    if path and os.path.exists(full):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
