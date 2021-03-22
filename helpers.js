const emailLookUp = function(emailInput, database) {
  for (const user in database) {
    if (database[user].email === emailInput) {
       return database[user].id;
    }
  }
  return undefined;
};

const generateRandomString = function() {
  let num = Math.random().toString(36).substring(2,8);
  return num;
};

const urlsForUser = function(id, database) {
  usersUrlDatabase = {};

  for (let url in database) {
    if(database[url].userId === id) {
      let temp = { shortURL: url, longURL: database[url].longURL };   
      usersUrlDatabase[url] = temp;
    }
  }
  return usersUrlDatabase;
};

module.exports = { emailLookUp, generateRandomString, urlsForUser };