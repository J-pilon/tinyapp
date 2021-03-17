const express = require("express");
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs")

function generateRandomString() {
  const chars = 'abcdefghijklmnopqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    let num = Math.floor(Math.random() * 36);
    result += chars[num];
  }
  return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(bodyParser.urlencoded({extended: true}));

app.post("/urls", (request, response) => { 
  const randomNum = generateRandomString();
  urlDatabase[randomNum] = request.body.longURL;

  const templateVars = { urls: urlDatabase };
  response.render("urls_index", templateVars);
});

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

app.post("/login", (request, response) => {
  console.log("username");
  response.redirect("/urls");
});

app.get("/", (request, response) => {
  response.send("Hello");
});

// app.get("/urls.json", (request, response) => {
//   response.json(urlDatabase);
// });

// app.get("/hello", (request, response) => {
//   response.send("<html><body>Hello <b>World</b></body></html>\n")
// });

app.get("/urls", (request, response) => {
  const templateVars = { urls: urlDatabase };
  response.render("urls_index", templateVars);
});

app.get("/urls/new", (request, response) => {
  response.render("urls_new")
});

app.get("/u/:shortURL", (request, response) => {
  const longURL = request.params.shortURL;
  const newURL = urlDatabase[longURL];
  response.redirect(newURL);
});

app.get("/urls/:shortURL", (request, response) => {
  const key = request.params.shortURL;
  const templateVars = { shortURL: request.params.shortURL, longURL: urlDatabase[key] };
  response.render("urls_show", templateVars);
});

app.get("*", (request, response) => {
  response.render("urls_404");
});

app.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`)
});
