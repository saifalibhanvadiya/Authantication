const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const haspassword = await bcrypt.hash(request.body.password, 10);

  const chekuserquery = `SELECT * FROM user WHERE username = '${username}' `;
  const check = await db.get(chekuserquery);

  if (check === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${haspassword}', 
          '${gender}',
          '${location}'
        )`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.status(200);
      response.send(`User created successfully`);
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// reset pass world
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not Register");
  } else {
    const isvalidpassword = await bcrypt.compare(oldPassword, dbUser.password);

    if (isvalidpassword === true) {
      const lenghtofnewpassword = newPassword.length;
      if (lenghtofnewpassword < 5) {
        response.stutus(400);
        response.send("Password is too short");
      } else {
        const enctyptNewPassword = await bcrypt.hash(newPassword, 10);
        const updatenewpasswword = `
                UPDATE user SET password ='${enctyptNewPassword}'
                WHERE username = '${username}'`;
        await db.run(updatenewpasswword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
