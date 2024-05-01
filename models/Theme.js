// Mongodb et Mongoose :
const mongoose = require("mongoose");
const themeSchema = new mongoose.Schema({
  themeName: { type: "String" },
  userId: { type: "String"},
});
module.exports = mongoose.model("Theme", themeSchema);