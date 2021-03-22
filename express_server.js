const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const cookieSession = require('cookie-session');

const { emailLookUp, generateRandomString, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {};

// database for the users id, email, password
const users = {};

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["key1"],
}));

// user registers and userId stored in cookie
app.post("/register", (request, response) => {
  const { email, password } = request.body;
  
  if (emailLookUp(email, users) || email.length === 0 || password.length === 0) {
    response.send('Error with registration! If already registered, please login');
  } else {
    const userId = generateRandomString();
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {      
        users[userId] = { id: userId, email: email, password: hash };
      });
      response.redirect("/login");
    });
  }
})
  
// registration page
app.get("/register", (request, response) => {
  const templateVars = { user: users[request.session.userCookie] };
  response.render("urls_register", templateVars);
});

// logining in a user
app.post("/login", (request, response) => {
  const { email, password } = request.body;
  const user = emailLookUp(email, users);
  const hash = user.password;
  request.session.userCookie = user.id;

  if (!user) {
    response.send("No user with that email found");
    return;
  } else {
    bcrypt.compare(password, hash, function(err, res) {
      if(res){
        response.redirect("/urls");
      } else {
        response.send("error: passwords dont match");
        return;
      }
     });
  }
});

// user login page
app.get("/login", (request, response) => {
  const { email } = request.body;
  const userId = emailLookUp(email, users);
  const templateVars = { user: users[userId] };
  response.render("urls_login", templateVars);
});

// logout user
app.post("/logout", (request, response) => {
  request.session = null;
  response.redirect("/login");
});

app.get("/logout", (request, response) => {
  response.render("urls_show");
});

// request to generate shortURL for longURL
app.post("/urls", (request, response) => {
  const { longURL } = request.body;
  const shortURL = generateRandomString();
 
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = longURL;
  urlDatabase[shortURL].userId = request.session.userCookie

  response.redirect("/urls");
});

// lists urls from database
app.get("/urls", (request, response) => {
  const { userCookie } = request.session;
  const user = users[userCookie];

  usersUrlDatabase = urlsForUser(userCookie, urlDatabase);
  const templateVars = { user, urls: usersUrlDatabase, userId: userCookie};
  response.render("urls_index", templateVars);
});

app.get("/urls/new", (request, response) => {
  const user = users[request.session.userCookie];
  if (!user) {
    response.redirect("/register");
  } else {
    const templateVars = { user };
    response.render("urls_new", templateVars);
  }
});

// request to delete entry
app.post("/urls/:shortURL/delete", (request, response) => {
  const { userCookie } = request.session;
  const { shortURL } = request.params;

  if (urlDatabase[shortURL].userId === userCookie) {
    delete urlDatabase[shortURL];
    delete shortURL;
    response.redirect("/urls");
  } else {
    response.send("Cant delete that");
  }
  
});

// update longURL value in database
app.post("/urls/:shortURL", (request, response) => {
  const { shortURL } = request.params;
  urlDatabase[shortURL].longURL = request.body.longURL;
  response.redirect("/urls");
});

// edit longURL
app.get("/urls/:shortURL", (request, response) => {
  const { shortURL, longURL } = request.params;
  const userCookie = request.session.userCookie;

  const templateVars = { user: users[userCookie], shortURL, longURL };
  response.render("urls_show", templateVars);
});

// home page
app.get("/", (request, response) => {
  response.send("Hello");
});

// use shortURL as parameter to be redirected to longURL's page
app.get("/u/:shortURL", (request, response) => {
  const { shortURL } = request.params;
  const longURL = urlDatabase[shortURL].longURL;
  response.redirect(longURL);
});

// 404-page not found
app.get("*", (request, response) => {
  response.sendStatus(404);
});

// server is listening
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

