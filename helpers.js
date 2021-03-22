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


module.exports = { emailLookUp, generateRandomString };