const express = require("express");
const bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
// const { request } = require("express");
const morgan = require('morgan');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const generateRandomString = function() {
 
  let num = Math.random().toString(36).substring(2,8);
  return num;
};

const emailLookUp = function(emailInput, users) {
  for (const user in users) {
    if (users[user].email === emailInput) {
      return users[user];
    }
  }
  return false;
};



const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};
// database for the users id, email, password
const users = {};

// helper functions:


//
//  middleware
//

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// user registers and user_id stored in cookie
app.post("/register", (request, response) => {
  const email = request.body.email;
  const password = request.body.password;

  if (emailLookUp(email, users) || email.length === 0 || password.length === 0) {
    response.send('Error with registration! If already registered, please login');
    return;
  }
  const user_id = generateRandomString();
  users[user_id] = { id: user_id, email: email, password: password };

  response.cookie("user_id", user_id);
  response.redirect("/urls");
});
// Working^

//
// user_id is the random string stored in a cookie
//

// registration page
app.get("/register", (request, response) => {
  const templateVars = { user: users[request.cookies.user_id] };
  response.render("urls_register", templateVars);
});

// logining in a user
app.post("/login", (request, response) => {
  const credentials = request.body;
  
  if (!credentials.email || !credentials.password) {
    return response.statusCode(403)
  } else if (emailLookUp(credentials.email, users) ) {
    const userObj = emailLookUp(credentials.email, users);
    console.log('userObj: ', userObj);

    if (credentials.password === userObj.password) {
      return response.cookie("user_id", userObj.id).redirect("/urls");
    } else {
      return response.statusCode(403)
    }
  }

  return response.statusCode(403);
});

// user login page
app.get("/login", (request, response) => {
  const templateVars = { user: users[request.cookies["user_id"]] };
  response.render("urls_login", templateVars);
});

//
// username is the username stored in a cookie
//

// logout user
app.post("/logout", (request, response) => {
  response.clearCookie("user_id");
  response.redirect("/login");
});

app.get("/logout", (request, response) => {
  response.render("urls_show");
});

// request to generate shortURL for longURL
app.post("/urls", (request, response) => {
  // cannot make tiny url if user hasnt registered
  // console.log('id: ', request.cookies.user_id);
  const string = generateRandomString();
  urlDatabase[string] = request.body.longURL;
  const templateVars = { urls: urlDatabase };
  response.render("/urls", templateVars);
});

// lists urls from database
app.get("/urls", (request, response) => {
  const user = users[request.cookies.user_id];
  const templateVars = { user: user, urls: urlDatabase };
  response.render("urls_index", templateVars);
});

app.get("/urls/new", (request, response) => {
  const user = users[request.cookies.user_id];
  if (!user) {
    response.redirect("/register");
  } else {
    const templateVars = { user: users[request.cookies.user_id]};
    response.render("urls_new", templateVars);
  }
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

// edit longURL
app.get("/urls/:shortURL", (request, response) => {
  console.log('wtf');
  const shortURL = request.params.shortURL;
  const templateVars = { user: users[request.cookies.user_id], shortURL: request.params.shortURL, longURL: urlDatabase[shortURL] };
  response.render("urls_show", templateVars);
});


// home page
app.get("/", (request, response) => {
  response.send("Hello");
});

// create a new shortURL

// use shortURL as parameter to be redirected to longURL's page
app.get("/u/:shortURL", (request, response) => {
  const longURL = request.params.shortURL;
  const newURL = urlDatabase[longURL];
  response.redirect(newURL);
});



// 404-page not found
app.get("*", (request, response) => {
  response.sendStatus(404);
});

// server is listening
app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
