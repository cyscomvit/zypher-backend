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
    res.json(db.prepare("SELECT username, level, scene_reached, answered_levels FROM users WHERE username = ?").get(req.username));
});

app.post("/question", authorize, (req, res) => {
    // res.json(
    //     db
    //         .prepare(
    //             "SELECT level, text, image FROM questions WHERE level = (SELECT level FROM users WHERE username = ?)"
    //         )
    //         .get(req.username)
    // );

    const { question_level = "" } = req.body;
    res.json(
        db
            .prepare(
                "SELECT level, scene, text, image FROM questions WHERE level = ?"
            )
            .get(question_level)
    )
});

app.post("/answer", authorize, (req, res) => {
    // this section will work only if user submits answer
    const { answer = "", question_level = "" } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(req.username);
    const question = db.prepare("SELECT * FROM questions WHERE level = ?").get(question_level);

    // getting the correct levels
    const currentLevels = (user.answered_levels || "").split(",").map(Number);

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

    // adding the current level to the list of answered levels since the answer is correct
    if (!currentLevels.includes(question.level)) {
        currentLevels.push(question.level);
    }
    console.log(currentLevels.join(","))
    db.prepare("UPDATE users SET answered_levels = ? WHERE username = ?").run(
        currentLevels.join(","),
        user.username
    );

// now updating the user scene and level
    if (user.level === 1 && user.scene_reached === 1 && question.scene === 1) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 2, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
    }
    // he/she solves either chest level 2 or 3, which increments the user level
    else if (user.scene_reached === 2 && question.scene === 2) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 3, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
    }
    // similarly for others
    else if (user.scene_reached === 3 && question.scene === 3) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 4, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
    }
    else if (user.scene_reached === 4 && question.scene === 4) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 5, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
    }
    // this logic is for user coming back after completing the game, to climb up the leaderboard. only level is updated, scene remains same
    else if (user.scene_reached != question.scene) {
        db.prepare(
            "UPDATE users SET level = level + 1, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
    }
    // for now scene 5 is finish line, if scene 5 is reached, game ends

    // db.prepare(
    //     "UPDATE users SET level = level + 1, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
    // ).run(user.username);

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

    const { level, scene, text, image, answer } = req.body;

    res.json(
        db
            .prepare(
                "INSERT INTO questions (level, scene, text, image, answer) VALUES (?, ?, ?, ?, ?) RETURNING *"
            )
            .get(level, scene, text, image, answer)
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
