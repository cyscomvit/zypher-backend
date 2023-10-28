CREATE TABLE
    IF NOT EXISTS questions (
        level INTEGER PRIMARY KEY NOT NULL,
        scene INTEGER NOT NULL DEFAULT 1,
        text TEXT NOT NULL,
        image TEXT,
        answer TEXT NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS users (
        username TEXT PRIMARY KEY NOT NULL CHECK(
            LENGTH(username) BETWEEN 3 AND 20
        ),
        avatar TEXT NOT NULL,
        password TEXT NOT NULL,
        member_1_name TEXT NOT NULL,
        member_2_name TEXT NOT NULL,
        member_3_name TEXT NOT NULL,
        member_1_regno TEXT NOT NULL,
        member_2_regno TEXT NOT NULL,
        member_3_regno TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        scene_reached NOT NULL DEFAULT 1,
        answered_levels TEXT NOT NULL DEFAULT '[]',
        reachedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    IF NOT EXISTS attempts (
        username TEXT NOT NULL REFERENCES users(username),
        level INTEGER NOT NULL REFERENCES questions(level),
        attempt TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX
    IF NOT EXISTS leaderboard ON users(level DESC, reachedAt ASC);