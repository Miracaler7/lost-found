/*const mongoose = require("mongoose");

const foundItemSchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  location_found: { type: String, required: true },
  description: { type: String },
  finder_email: { type: String, required: true },
  finder_phone: { type: String, required: true },
  image_url: { type: String }, // store image path or cloud URL
  // date_found: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FoundItem", foundItemSchema); */

const mongoose = require("mongoose");

const foundItemSchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  location_found: { type: String, required: true },
  description: { type: String },
  finder_email: { type: String, required: true },
  finder_phone: { type: String, required: true },
  image_url: { type: String },
  returned: { type: Boolean, default: false }  // NEW FIELD
});

module.exports = mongoose.model("FoundItem", foundItemSchema);

