const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: "FoundItem" },
    claimant_email: String,
    claimant_phone: String,
    claimant_usn: String,
    status: { type: String, default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
