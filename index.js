const Express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { Password, cacher, createDatabase, useJwt } = require("./utils");

require("dotenv").config();

if (!process.env.JWT_SECRET) throw new Error("Missing Environment Variable JWT_SECRET");

const app = Express();

const nginxFormat =
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status';

app.use(morgan(nginxFormat));

const db = createDatabase("paradox.sqlite3");

app.use(Express.json());
app.use(cors('*'));

app.post("/register", async (req, res) => {
    const { username = "", password = "", avatar = "" } = req.body;

    try {
        const user = db
            .prepare(
                "INSERT INTO users (username, password, avatar) VALUES (?, ?, ?) RETURNING username, avatar, level"
            )
            .get(username, await Password.hash(password), avatar);

        res.json(user);
    } catch (err) {
        if (err.code === "SQLITE_CONSTRAINT_CHECK")
            return res.status(400).json({ error: "Username must be between 3 and 20 characters" });

        if (err instanceof Password.PasswordLengthError)
            return res.status(400).json({ error: "Password must be between 8 and 100 characters" });

        if (err.code === "SQLITE_CONSTRAINT")
            return res.status(400).json({ error: "Username already taken" });

        res.status(500).json({ error: "Internal server error" });
        console.err(err);
    }
});

const [login, authorize] = useJwt(process.env.JWT_SECRET, "HS256", "2d");

app.post("/login", async (req, res) => {
    const { username = "", password = "" } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !(await Password.verify({ hashed: user.password, password }))) {
        return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = login({ username });
    res.json({ token });
});

app.get("/me", authorize, (req, res) => {
    res.json(db.prepare("SELECT username, level FROM users WHERE username = ?").get(req.username));
});

app.get("/question", authorize, (req, res) => {
    res.json(
        db
            .prepare(
                "SELECT level, text, image FROM questions WHERE level = (SELECT level FROM users WHERE username = ?)"
            )
            .get(req.username)
    );
});

app.post("/answer", authorize, (req, res) => {
    const { answer = "" } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(req.username);
    const question = db.prepare("SELECT * FROM questions WHERE level = ?").get(user.level);

    if (!question) {
        return res.json({ error: "No more questions" });
    }

    db.prepare("INSERT INTO attempts (username, level, attempt) VALUES (?, ?, ?)").run(
        user.username,
        user.level,
        answer
    );

    if (answer !== question.answer) {
        return res.json({ correct: false });
    }

    db.prepare(
        "UPDATE users SET level = level + 1, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
    ).run(user.username);

    res.json({ correct: true });
});

const leaderboardStmt = db.prepare(
    "SELECT username, level FROM users ORDER BY level DESC, reachedAt ASC"
);
const leaderboard = cacher(60)(() => leaderboardStmt.all());
// app.get("/leaderboard", (_, res) => res.json(leaderboard()));

app.get('/leaderboard', (req, res) => {
    const data = db.prepare("SELECT username, level FROM users ORDER BY level DESC, reachedAt ASC").all();
    res.json(data);

})


app.post("/add-question", (req, res) => {
    // if (req.query.password != process.env.ADMIN_PASSWORD) {
    //     return res.status(401).json({ error: "Invalid password" });
    // }

    const { level, text, image, answer } = req.body;

    res.json(
        db
            .prepare(
                "INSERT INTO questions (level, text, image, answer) VALUES (?, ?, ?, ?) RETURNING *"
            )
            .get(level, text, image, answer)
    );
});

app.post("/delete-question", (req, res) => {
    // if (req.query.password != process.env.ADMIN_PASSWORD) {
    //     return res.status(401).json({ error: "Invalid password" });
    // }

    const { level } = req.body;

    res.json(db.prepare("DELETE FROM questions WHERE level = ?").run(level));
});

app.get("/all-questions", (req, res) => {
    // if (req.query.password != process.env.ADMIN_PASSWORD) {
    //     return res.status(401).json({ error: "Invalid password" });
    // }

    res.json(db.prepare("SELECT * FROM questions").all());
});

app.post("/delete-user", (req, res) => {
    // if (req.query.password != process.env.ADMIN_PASSWORD) {
    //     return res.status(401).json({ error: "Invalid password" });
    // }

    const { username } = req.body;

    res.json(db.prepare("DELETE FROM users WHERE username = ?").run(username));
});

app.post("/edit-username", (req, res) => {
    // if (req.query.password != process.env.ADMIN_PASSWORD) {
    //     return res.status(401).json({ error: "Invalid password" });
    // }

    const { username, newUsername } = req.body;

    res.json(
        db.prepare("UPDATE users SET username = ? WHERE username = ?").run(newUsername, username)
    );
});

app.post("/edit-password", (req, res) => {
    // if (req.query.password != process.env.ADMIN_PASSWORD) {
    //     return res.status(401).json({ error: "Invalid password" });
    // }

    const { username, password } = req.body;

    res.json(
        db.prepare("UPDATE users SET password = ? WHERE username = ?").run(password, username)
    );
});

app.get("/attempts", (req, res) => {
    // if (req.query.password != process.env.ADMIN_PASSWORD) {
    //     return res.status(401).json({ error: "Invalid password" });
    // }

    res.json(db.prepare("SELECT * FROM attempts").all());
});

app.get("/test", (_, res) => {
    res.send({ Message: "Server is up and running" });
});

app.listen(8080, console.log("Server started on port 8080."));
