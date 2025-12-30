const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoundItem",
      required: true
    },
    claimant_email: {
      type: String,
      required: true
    },
    claimant_phone: {
      type: String,
      required: true
    },
    claimant_usn: {
      type: String,
      required: true
    },
    status: {
      type: String,
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
