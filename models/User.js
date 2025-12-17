const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: { type: String, unique: true },
  usn: String,
  password: String
});

module.exports = mongoose.model("User", userSchema);
