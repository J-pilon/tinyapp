const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
// const { request } = require("express");
const morgan = require('morgan');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const randomString = function() {
  const chars = 'abcdefghijklmnopqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    let num = Math.floor(Math.random() * 36);
    result += chars[num];
  }
  return result;
};

const emailLookUp = function(emailInput) {
  for (const key in users) {
    if (users[key].email === emailInput) {
      return true;
    } else {
      return false;
    }
  }
};



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// database for the users id, email, password
const users = {};

//
//  middleware
//

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//
// client-side
//

// user registers and user_id stored in cookie
app.post("/register", (request, response) => {
  const email = request.body.email;
  const password = request.body.password;

  if (emailLookUp(email) || email.length === 0 || password.length === 0) {
    response.sendStatus(400);
    return;
  }
  const id = randomString();
  users[id] = {};
  users[id].email = email;
  users[id].password = password;

  response.cookie("user_id", id);
  response.redirect("/urls");
});

//
// user_id is the random string stored in a cookie
//

app.post("/login", (request, response) => {
  if (emailLookUp(request.body.email)) {
    response.redirect("/urls");
    return;
  }
  const id = randomString();
  response.cookie("user_id", id);
  response.redirect("/register");
});

// request to generate shortURL for longURL
app.post("/urls", (request, response) => {
  const string = randomString();
  urlDatabase[string] = request.body.longURL;
  const templateVars = { urls: urlDatabase };
  response.render("/urls", templateVars);
});

// request to delete entry
app.post("/urls/:shortURL/delete", (request, response) => {
  const shortURL = request.params.shortURL;
  delete urlDatabase[shortURL];
  response.redirect("/urls");
});

// update longURL value in database
app.post("/urls/:shortURL", (request, response) => {
  const shortURL = request.params.shortURL;
  urlDatabase[shortURL] = request.body.longURL;
  response.redirect("/urls");
});

// saves username
app.post("/login", (request, response) => {
  response.cookie("user_id", request.body.user_id);
  response.redirect("/urls");
});

//
// username is the username stored in a cookie
//

// logout user
app.post("/logout", (request, response) => {
  response.clearCookie("user_id");
  response.redirect("/urls");
});

//
// server-side
//

// registration page
app.get("/register", (request, response) => {
  console.log('user_id: ', request.cookies.user_id);
  const templateVars = {user: request.cookies.user_id};
  response.render("urls_register", templateVars);
});

// user can login with email and password
app.get("/login", (request, response) => {
  const templateVars = { user: request.cookies.user_id };
  response.render("urls_login", templateVars);
});

// home page
app.get("/", (request, response) => {
  response.send("Hello");
});

app.get("/logout", (request, response) => {
  response.render("urls_show");
});
// lists urls from database

app.get("/urls", (request, response) => {
  const templateVars = { user: request.cookies.user_id, urls: urlDatabase };
  response.render("urls_index", templateVars);
});

// create a new shortURL
app.get("/urls/new", (request, response) => {
  response.render("urls_new");
});

// use shortURL as parameter to be redirected to longURL's page
app.get("/u/:shortURL", (request, response) => {
  const longURL = request.params.shortURL;
  const newURL = urlDatabase[longURL];
  response.redirect(newURL);
});

// edit longURL
app.get("/urls/:shortURL", (request, response) => {
  const shortURL = request.params.shortURL;
  const templateVars = { user: users[request.cookies.user_id], shortURL: request.params.shortURL, longURL: urlDatabase[shortURL] };
  response.render("urls_show", templateVars);
});

// 404-page not found
app.get("*", (request, response) => {
  response.sendStatus(404);
});

// server is listening
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
