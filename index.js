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
app.set('view engine', 'ejs');


app.get("/admin/forms", async(req,res)=>{
    res.render('forms')
})

app.get('/admin/index', async(req,res)=>{
    let regTeamDetails = db.prepare("SELECT username, member_1_name, member_1_regno, member_2_name, member_2_regno, member_3_name, member_3_regno, answered_levels FROM users").all();
    // we will get the challenge completed users based on answered_levels
    console.log(regTeamDetails)
    let challenge_1_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("1");
    });
    let challenge_2_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("2");
    });
    let challenge_3_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("3");
    });
    let challenge_4_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("4");
    });
    let challenge_5_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("5");
    });
    let challenge_6_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("6");
    });
    let challenge_7_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("7");
    });
    let challenge_8_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("8");
    });
    let challenge_9_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("9");
    });
    let challenge_10_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("10");
    });
    let challenge_11_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("11");
    });
    let challenge_12_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("12");
    });
    let challenge_13_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("13");
    });
    let challenge_14_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("14");
    });
    let challenge_15_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("15");
    });
    let challenge_16_completed = regTeamDetails.filter((team) => {
        return team.answered_levels.includes("16");
    });

    res.render('index', {
        challenge_1_completed: challenge_1_completed,
        challenge_2_completed: challenge_2_completed,
        challenge_3_completed: challenge_3_completed,
        challenge_4_completed: challenge_4_completed,
        challenge_5_completed: challenge_5_completed,
        challenge_6_completed: challenge_6_completed,
        challenge_7_completed: challenge_7_completed,
        challenge_8_completed: challenge_8_completed,
        challenge_9_completed: challenge_9_completed,
        challenge_10_completed: challenge_10_completed,
        challenge_11_completed: challenge_11_completed,
        challenge_12_completed: challenge_12_completed,
        challenge_13_completed: challenge_13_completed,
        challenge_14_completed: challenge_14_completed,
        challenge_15_completed: challenge_15_completed,
        challenge_16_completed: challenge_16_completed,
        regTeamDetails: regTeamDetails,
    })

})

app.post("/register", async (req, res) => {
    const { username = "", password = "", avatar = "", member_1_name, member_1_regno, member_2_name, member_2_regno,member_3_name, member_3_regno, } = req.body;
    console.log(req.body);

    try {
        // so 3 cases
        // one case is where only one member name and regno is ther
        // second case is where two member name and regno is there
        // third case is where all three member name and regno is there
        if(member_1_name && member_1_regno && member_2_name && member_2_regno && member_3_name && member_3_regno){
            const user = db
            .prepare(
                "INSERT INTO users (username, password, avatar, member_1_name, member_1_regno, member_2_name, member_2_regno, member_3_name, member_3_regno) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING username, avatar, level"
            )
            .get(username, await Password.hash(password), avatar, member_1_name, member_1_regno, member_2_name, member_2_regno, member_3_name, member_3_regno);
            console.log(user)
            res.json(user);
            
        }
        else if(member_1_name && member_1_regno && member_2_name && member_2_regno){
            const user = db
            .prepare(
                "INSERT INTO users (username, password, avatar, member_1_name, member_1_regno, member_2_name, member_2_regno) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING username, avatar, level"
            )
            .get(username, await Password.hash(password), avatar, member_1_name, member_1_regno, member_2_name, member_2_regno);
            console.log(user)
            res.json(user);
        }
        else if(member_1_name && member_1_regno){
            const user = db
            .prepare(
                "INSERT INTO users (username, password, avatar, member_1_name, member_1_regno) VALUES (?, ?, ?, ?, ?) RETURNING username, avatar, level"
            )
            .get(username, await Password.hash(password), avatar, member_1_name, member_1_regno);
            console.log(user)
            res.json(user);
        }
        else{
            res.status(400).json({ error: "Please enter atleast one member name and regno" });
        }

        // const user = db
        //     .prepare(
        //         "INSERT INTO users (username, password, avatar) VALUES (?, ?, ?) RETURNING username, avatar, level"
        //     )
        //     .get(username, await Password.hash(password), avatar);

        // res.json(user);


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
    // team username and password for authentication
    const { username = "", password = "" } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !(await Password.verify({ hashed: user.password, password }))) {
        return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = login({ username });
    res.json({ token });
});

app.get("/me", authorize, (req, res) => {
    res.json(db.prepare("SELECT username, level, scene_reached, answered_levels, answered_special_challenges FROM users WHERE username = ?").get(req.username));
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
                "SELECT level, scene, hidden, text, url FROM questions WHERE level = ?"
            )
            .get(question_level)
    )
});

app.get("/special-question", authorize, (req, res) => {
    let question1 = db.prepare("SELECT level, text, link, description FROM special_challenges WHERE level = 1").get();
    let question2 = db.prepare("SELECT level, text, link, description FROM special_challenges WHERE level = 2").get();
    let question3 = db.prepare("SELECT level, text, link, description FROM special_challenges WHERE level = 3").get();
    let question4 = db.prepare("SELECT level, text, link, description FROM special_challenges WHERE level = 4").get();
    let question5 = db.prepare("SELECT level, text, link, description FROM special_challenges WHERE level = 5").get();
    console.log(question4)
    res.json([question1, question2, question3, question4, question5]);
})

app.post("/add-special-question", (req, res) => {
    let { level, text, link, description, answer } = req.body;
    console.log(req.body)
    res.json(
        db
            .prepare(
                "INSERT INTO special_challenges (level, text, link,description, answer) VALUES (?, ?, ?,?, ?) RETURNING *"
            )
            .get(level, text, link, description, answer)
    );
});

app.post("/delete-special-question", (req, res) => {
    // if (req.query.password != process.env.ADMIN_PASSWORD) {
    //     return res.status(401).json({ error: "Invalid password" });
    // }
    let level = req.body.level;
    console.log(level)
    res.json(db.prepare("DELETE FROM special_challenges WHERE level = ?").run(level));
});

app.post("/special-answer", authorize, (req, res) => {  
    const { answer = "", question_level = "" } = req.body.data;
    console.log("The details are:",req.body)
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(req.username);
    const question = db.prepare("SELECT * FROM special_challenges WHERE level = ?").get(question_level);

    // getting the correct levels
    const currentLevels = (user.answered_special_challenges || "").split(",").map(Number);
    console.log(currentLevels)

    if (!question) {
        return res.json({ error: "No more questions" });
    }

    

    if (answer !== question.answer) {
        return res.json({ correct: false });
    }

    // adding the current level to the list of answered levels since the answer is correct
    if (!currentLevels.includes(question.level)) {
        currentLevels.push(question.level);
        db.prepare("UPDATE users SET answered_special_challenges = ? WHERE username = ?").run(
            currentLevels.join(","), user.username
        );
        console.log("answer is correct")

        return res.json({ correct: true });

    }
    else{
        console.log("already answered" )
        return res.json({ correct: "already answered" });
    }
    
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
    else if (user.scene_reached === 5 && question.scene === 5) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 6, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
        console.log("scene 6 reached")
    }
    else if (user.scene_reached === 6 && question.scene === 6) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 7, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
        console.log("scene 7 reached")
    }
    else if (user.scene_reached === 7 && question.scene === 7) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 8, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
    }
    else if (user.scene_reached === 8 && question.scene === 8) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 9, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
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

    const { level, scene, text, url, answer } = req.body;

    res.json(
        db
            .prepare(
                "INSERT INTO questions (level, scene, text, url, answer) VALUES (?, ?, ?, ?, ?) RETURNING *"
            )
            .get(level, scene, text, url, answer)
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

app.post("/delete-team", (req, res) => {
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


app.post("/completeChallenge", (req, res) => {
    // this section will work only if user submits answer
    const { answer = "", question_level = "" , username} = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
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
    console.log("user details level and scene reached", user.level, user.scene_reached)

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
    else if (user.scene_reached === 5 && question.scene === 5) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 6, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
        console.log("scene 6 reached")
    }
    else if (user.scene_reached === 6 && question.scene === 6) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 7, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
        console.log("scene 7 reached")
    }
    else if (user.scene_reached === 7 && question.scene === 7) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 8, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
        ).run(user.username);
    }
    else if (user.scene_reached === 8 && question.scene === 8) {
        db.prepare(
            "UPDATE users SET level = level + 1, scene_reached = 9, reachedAt = CURRENT_TIMESTAMP WHERE username = ?"
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
})

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
