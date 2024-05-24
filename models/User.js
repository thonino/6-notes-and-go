// Mongodb et Mongoose :
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: "String"},
  email: { type: "String", unique: true },
  password: { type: "String" },
  role: { type: "String" },
  token: { type: "String" },
  tokenExpires: { type: Date } 
});
module.exports = mongoose.model("User", userSchema);