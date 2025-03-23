const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number, required: true },
  date: { type: String, required: true },
});

module.exports = mongoose.model("Score", scoreSchema);
