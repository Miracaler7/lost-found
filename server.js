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

mongoose
  .connect(
    "mongodb+srv://rushil200581_db_user:mrBbmixmy64MOEPX@cluster0.dyyzu9h.mongodb.net/lostfoundDB"
  )
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

/* ---------------- USER AUTH ---------------- */

app.post("/signup", async (req, res) => {
  const { name, phone, email, usn, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    name,
    phone,
    email,
    usn,
    password: hashed
  });

  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.json({ success: false });

  const ok = await bcrypt.compare(req.body.password, user.password);
  res.json({ success: ok });
});

/* ---------------- ADD FOUND ITEM (FIXED) ---------------- */

app.post("/add-found-item", upload.single("image"), async (req, res) => {
  const category =
    req.body.category && req.body.category.trim()
      ? req.body.category
      : "Miscellaneous";

  await FoundItem.create({
    item_name: req.body.item_name,
    category: category,                 // ✅ FIX
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

app.post("/claim-item", async (req, res) => {
  const { item_id, claimant_email, claimant_phone, claimant_usn } = req.body;

  await Claim.create({
    item_id,
    claimant_email,
    claimant_phone,
    claimant_usn
  });

  res.json({ success: true });
});

app.get("/returned-items", async (req, res) => {
  const claims = await Claim.find({ status: "approved" }).populate("item_id");

  const returned = claims.map(c => ({
    item: c.item_id,
    claimant_email: c.claimant_email,
    claimant_phone: c.claimant_phone,
    claimant_usn: c.claimant_usn
  }));

  res.json({ success: true, returned });
});

/* ---------------- ADMIN ROUTES ---------------- */

app.get("/admin/pending-items", async (req, res) => {
  const items = await FoundItem.find({ approved: false });
  res.json(items);
});

app.post("/admin/approve-item/:id", async (req, res) => {
  await FoundItem.findByIdAndUpdate(req.params.id, { approved: true });
  res.json({ success: true });
});

app.delete("/admin/delete-item/:id", async (req, res) => {
  await FoundItem.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get("/admin/pending-claims", async (req, res) => {
  const claims = await Claim.find({ status: "pending" }).populate("item_id");
  res.json(claims);
});

app.post("/admin/approve-claim/:id", async (req, res) => {
  const claim = await Claim.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );

  await FoundItem.findByIdAndUpdate(claim.item_id, {
    returned: true
  });

  res.json({ success: true });
});

app.delete("/admin/reject-claim/:id", async (req, res) => {
  await Claim.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ---------------- START SERVER ---------------- */

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
