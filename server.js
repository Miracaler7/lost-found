const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("./models/User");
const FoundItem = require("./models/FoundItem");
const Claim = require("./models/Claim");

const app = express();

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ---------------- UPLOADS ---------------- */

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

/* ---------------- MONGODB ---------------- */

mongoose.connect(
  "mongodb+srv://rushil200581_db_user:mrBbmixmy64MOEPX@cluster0.dyyzu9h.mongodb.net/lostfoundDB"
).then(() => console.log("MongoDB connected"));

/* ---------------- USER AUTH ---------------- */

app.post("/signup", async (req, res) => {
  const { name, phone, email, usn, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, phone, email, usn, password: hashed });
  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.json({ success: false });
  const ok = await bcrypt.compare(req.body.password, user.password);
  res.json({ success: ok });
});

/* ---------------- ADD FOUND ITEM ---------------- */

app.post("/add-found-item", upload.single("image"), async (req, res) => {
  const category =
    req.body.category && req.body.category.trim()
      ? req.body.category
      : "Miscellaneous";

  await FoundItem.create({
    item_name: req.body.item_name,
    category,
    location_found: req.body.location_found,
    date_found: req.body.date_found,
    description: req.body.description,
    finder_email: req.body.finder_email,
    finder_phone: req.body.finder_phone,
    image_url: `/uploads/${req.file.filename}`,
    approved: false,
    returned: false
  });

  res.json({ success: true });
});

/* ---------------- USER VIEWS ---------------- */

app.get("/found-items", async (req, res) => {
  const items = await FoundItem.find({
    approved: true,
    returned: false
  });
  res.json({ success: true, items });
});

/* ✅ USER MARK ITEM AS RETURNED (NEW – SAFE) */

app.post("/user/mark-returned/:id", async (req, res) => {
  const item = await FoundItem.findById(req.params.id);
  if (!item) {
    return res.json({ success: false, message: "Item not found" });
  }

  item.returned = true;
  await item.save();

  res.json({ success: true });
});

/* ---------------- 🚫 PREVENT DUPLICATE CLAIMS ---------------- */

app.post("/claim-item", async (req, res) => {
  const { item_id, claimant_email, claimant_phone, claimant_usn } = req.body;

  const item = await FoundItem.findById(item_id);
  if (!item) {
    return res.json({ success: false, message: "Item not found" });
  }

  if (item.returned) {
    return res.json({
      success: false,
      message: "Item has already been returned"
    });
  }

  const existingClaim = await Claim.findOne({
    item_id,
    status: { $in: ["pending", "approved"] }
  });

  if (existingClaim) {
    return res.json({
      success: false,
      message: "A claim already exists for this item"
    });
  }

  await Claim.create({
    item_id,
    claimant_email,
    claimant_phone,
    claimant_usn
  });

  res.json({ success: true });
});

/* ---------------- RETURNED ITEMS ---------------- */

app.get("/returned-items", async (req, res) => {
  const items = await FoundItem.find({ returned: true });

  const returned = await Promise.all(
    items.map(async item => {
      const claim = await Claim.findOne({
        item_id: item._id,
        status: "approved"
      });

      return {
        item,
        claimant_email: claim?.claimant_email || "N/A",
        claimant_phone: claim?.claimant_phone || "N/A",
        claimant_usn: claim?.claimant_usn || "N/A"
      };
    })
  );

  res.json({ success: true, returned });
});

/* ---------------- ADMIN ---------------- */

app.get("/admin/pending-items", async (req, res) => {
  res.json(await FoundItem.find({ approved: false }));
});

app.post("/admin/approve-item/:id", async (req, res) => {
  await FoundItem.findByIdAndUpdate(req.params.id, { approved: true });
  res.json({ success: true });
});

app.delete("/admin/delete-item/:id", async (req, res) => {
  await FoundItem.findByIdAndDelete(req.params.id);
  await Claim.deleteMany({ item_id: req.params.id });
  res.json({ success: true });
});

app.get("/admin/pending-claims", async (req, res) => {
  res.json(await Claim.find({ status: "pending" }).populate("item_id"));
});

app.post("/admin/approve-claim/:id", async (req, res) => {
  const claim = await Claim.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );

  await FoundItem.findByIdAndUpdate(claim.item_id, {
    approved: true,
    returned: true
  });

  res.json({ success: true });
});

app.delete("/admin/reject-claim/:id", async (req, res) => {
  await Claim.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ---------------- START ---------------- */

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
