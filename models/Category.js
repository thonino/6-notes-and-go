// Mongodb et Mongoose :
const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
  CategoryName: { type: "String", unique: true },
});
module.exports = mongoose.model("Category", categorySchema);