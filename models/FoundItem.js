const mongoose = require("mongoose");

const foundItemSchema = new mongoose.Schema({
  item_name: { type: String, required: true },
  location_found: { type: String, required: true },
  date_found: { type: String, required: true },   // ✅ NEW
  description: { type: String },
  finder_email: { type: String, required: true },
  finder_phone: { type: String, required: true },
  image_url: { type: String },

  approved: { type: Boolean, default: false },
  returned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("FoundItem", foundItemSchema);
