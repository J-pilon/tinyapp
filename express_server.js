const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const cookieSession = require('cookie-session');

const { emailLookUp, generateRandomString } = require('./helpers');

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


app.post("/register", (request, response) => {
  const { email, password } = request.body;

  if (email.length === 0 || password.length === 0) {
    response.send("Email or password incorrect!");
  } else if (emailLookUp(email, users)) {
    response.redirect("/urls");
  } else {
    const userId = generateRandomString();
    request.session.userCookie = userId;
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
        users[userId] = { id: userId, email: email, password: hash };
        response.redirect("/urls");
      });
    });
  }
});
  

app.get("/register", (request, response) => {
  const templateVars = { user: users[request.session.userCookie] };
  response.render("urls_register", templateVars);
});


app.post("/login", (request, response) => {
  const { email, password } = request.body;
  const id = emailLookUp(email, users);

  if (!id) {
    response.send("No user with that email found");
    return;
  } else {
    const hash = users[id].password;
    request.session.userCookie = id;
    bcrypt.compare(password, hash, function(err, res) {
      if (res) {
        response.redirect("/urls");
      } else {
        response.send("error: passwords dont match");
        return;
      }
    });
  }
});


app.get("/login", (request, response) => {
  const { email } = request.body;
  const id = emailLookUp(email, users);

  const templateVars = { user: users[id] };
  response.render("urls_login", templateVars);
});

app.post("/logout", (request, response) => {
  request.session = null;
  response.redirect("/login");
});

app.get("/logout", (request, response) => {
  response.render("urls_show");
});

// request to generate shortURL
// saves shortURL and longURL in database
app.post("/urls", (request, response) => {
  const { longURL } = request.body;
  const shortURL = generateRandomString();
 
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = longURL;
  urlDatabase[shortURL].userId = request.session.userCookie;
  response.redirect("/urls");
});

// lists urls from database
app.get("/urls", (request, response) => {
  const { userCookie } = request.session;


  const user = users[userCookie];
  if (!userCookie) {
    response.redirect("/login");
    return;
  }
  const userUrlDatabase = {};
  for (const short in urlDatabase) {
    if (urlDatabase[short].userId === userCookie) {
      userUrlDatabase[short] = { longURL: urlDatabase[short].longURL, userId: userCookie };
    }
  }
  const templateVars = { user, urls: userUrlDatabase, userId: userCookie};
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
  const userCookie = request.session.userCookie;

  if (userCookie) {
    const { shortURL } = request.params;
    const longURL = urlDatabase[shortURL].longURL;
  
    const templateVars = { user: users[userCookie], shortURL, longURL };
    response.render("urls_show", templateVars);
  } else {
    response.redirect("/login");
  }
});

app.get("/", (request, response) => {
  const userCookie = request.session.userCookie;
  
  if (userCookie) {
    response.redirect("/urls");
  } else {
    response.redirect("/login");
  }
});

// use shortURL as parameter to be redirected to longURL's page
app.get("/u/:shortURL", (request, response) => {
  const { shortURL } = request.params;
  const longURL = urlDatabase[shortURL].longURL;
  response.redirect(longURL);
});

app.get("*", (request, response) => {
  response.sendStatus(404);
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});

