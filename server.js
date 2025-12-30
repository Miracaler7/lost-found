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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------- UPLOADS ----------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"))
});
const upload = multer({ storage });

// ---------------- MONGO ----------------
mongoose
  .connect(
    "mongodb+srv://rushil200581_db_user:mrBbmixmy64MOEPX@cluster0.dyyzu9h.mongodb.net/lostfoundDB"
  )
  .then(() => console.log("MongoDB connected"));

// ---------------- AUTH ----------------
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

// ---------------- ADD ITEM (PENDING) ----------------
app.post("/add-found-item", upload.single("image"), async (req, res) => {
  await FoundItem.create({
    ...req.body,
    image_url: `/uploads/${req.file.filename}`,
    approved: false
  });
  res.json({ success: true });
});

// ---------------- GET APPROVED ITEMS ----------------
app.get("/found-items", async (req, res) => {
  const items = await FoundItem.find({ approved: true, returned: false });
  res.json({ success: true, items });
});

// ---------------- CLAIM ITEM ----------------
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

// ---------------- ADMIN ----------------
app.get("/admin/pending-items", async (req, res) => {
  const items = await FoundItem.find({ approved: false });
  res.json(items);
});

app.post("/admin/approve/:id", async (req, res) => {
  await FoundItem.findByIdAndUpdate(req.params.id, { approved: true });
  res.json({ success: true });
});

app.delete("/admin/reject/:id", async (req, res) => {
  await FoundItem.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ---------------- CLAIMS (ADMIN) ----------------
app.get("/admin/pending-claims", async (req, res) => {
  const claims = await Claim.find({ status: "pending" }).populate("item_id");
  res.json(claims);
});

app.post("/admin/approve-claim/:id", async (req, res) => {
  const claim = await Claim.findById(req.params.id);
  await FoundItem.findByIdAndUpdate(claim.item_id, { returned: true });
  await Claim.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.json({ success: true });
});

app.delete("/admin/reject-claim/:id", async (req, res) => {
  await Claim.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.listen(3000, () => console.log("Server running on 3000"));
