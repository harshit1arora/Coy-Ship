CREATE TABLE IF NOT EXISTS swipes (visitor TEXT NOT NULL, profile TEXT NOT NULL, decision TEXT NOT NULL CHECK(decision IN ('like','pass')), mutual INTEGER NOT NULL, PRIMARY KEY(visitor,profile));
