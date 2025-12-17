// server.js —
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Import Models
const User = require('./models/User');
const FoundItem = require('./models/FoundItem');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir)); // serve uploaded images

// ---------------- ADMIN CREDENTIALS ----------------
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234"; // change anytime

// Admin Login Route
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true, message: "Admin login successful" });
  }

  return res.json({ success: false, message: "Invalid admin credentials" });
});

// ==========================================================
// =============== MONGODB CONNECTION =======================
// ==========================================================

const mongoURI =
  'mongodb+srv://rushil200581_db_user:mrBbmixmy64MOEPX@cluster0.dyyzu9h.mongodb.net/lostfoundDB?retryWrites=true&w=majority';

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected successfully');

    // Helper Validation Functions
    const isBmsceEmail = (email) =>
      typeof email === 'string' && email.toLowerCase().endsWith('@bmsce.ac.in');

    const isStrongPassword = (password) => {
      const regex =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
      return regex.test(password) && !password.includes(' ');
    };

    // =========================== SIGNUP ===========================
    app.post('/signup', async (req, res) => {
      try {
        const { name, phone, email, usn, password } = req.body;

        if (!name || !phone || !email || !usn || !password) {
          return res.json({ success: false, message: 'All fields are required' });
        }
        if (!isBmsceEmail(email))
          return res.json({ success: false, message: 'Email must end with @bmsce.ac.in' });

        if (!isStrongPassword(password))
          return res.json({ success: false, message: 'Weak password' });

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists)
          return res.json({ success: false, message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
          name,
          phone,
          email: email.toLowerCase(),
          usn,
          password: hashedPassword,
        });

        await newUser.save();
        res.json({ success: true, message: 'User registered successfully' });
      } catch (err) {
        console.error('Signup error:', err);
        if (err.code === 11000)
          return res.json({ success: false, message: 'Email already exists' });

        res.status(500).json({
          success: false,
          message: 'Error registering user',
          error: err.message,
        });
      }
    });

    // =========================== LOGIN ===========================
    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        if (!email || !password)
          return res.json({ success: false, message: 'Missing credentials' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
          return res.json({ success: false, message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.json({ success: false, message: 'Incorrect password' });

        res.json({ success: true, message: 'Login successful' });
      } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // =========================== MULTER UPLOAD ===========================
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
      },
    });
    const upload = multer({ storage });

    // =========================== ADD FOUND ITEM ===========================
    app.post('/add-found-item', upload.single('image'), async (req, res) => {
      try {
        const { item_name, location_found, description, finder_email, finder_phone } =
          req.body;

        if (!item_name || !location_found || !finder_email || !finder_phone) {
          return res.status(400).json({
            success: false,
            message: 'Required fields missing',
          });
        }

        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const newItem = new FoundItem({
          item_name,
          location_found,
          description,
          finder_email,
          finder_phone,
          image_url,
        });

        await newItem.save();

        res.json({
          success: true,
          message: 'Item uploaded successfully',
          item: newItem,
        });
      } catch (err) {
        console.error('Add found item error:', err);
        res.status(500).json({
          success: false,
          message: 'Error uploading item',
          error: err.message,
        });
      }
    });

    // =========================== GET ALL ITEMS ===========================
    app.get('/found-items', async (req, res) => {
      try {
        const items = await FoundItem.find().sort({ date_found: -1 });
        res.json({ success: true, items });
      } catch (err) {
        console.error('Fetch items error:', err);
        res.status(500).json({
          success: false,
          message: 'Error fetching items',
          error: err.message,
        });
      }
    });

    // =========================== USER MARK RETURNED ===========================
    app.post('/mark-returned/:id', async (req, res) => {
      try {
        const item = await FoundItem.findById(req.params.id);
        if (!item)
          return res.json({ success: false, message: 'Item not found' });

        item.returned = true;
        await item.save();

        res.json({ success: true, message: 'Item marked as returned' });
      } catch (err) {
        console.error('Return item error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // =========================== ADMIN: GET ALL ITEMS ===========================
    app.get("/admin/items", async (req, res) => {
      const items = await FoundItem.find().sort({ date_found: -1 });
      res.json(items);
    });

    // =========================== ADMIN: DELETE ITEM ===========================
    app.delete("/admin/items/:id", async (req, res) => {
      await FoundItem.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    });

    // =========================== ADMIN: EDIT ITEM ===========================
    app.put("/admin/items/:id", async (req, res) => {
      const updated = await FoundItem.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.json(updated);
    });

    // =========================== ADMIN: MARK RETURNED ===========================
    app.patch("/admin/items/return/:id", async (req, res) => {
      await FoundItem.findByIdAndUpdate(req.params.id, { returned: true });
      res.json({ success: true });
    });

    // =========================== CLAIM ITEM ===========================
    app.post('/claim-item/:id', async (req, res) => {
      try {
        const { claimant_email, claimant_usn, claimant_phone } = req.body;

        if (!claimant_email || !claimant_usn || !claimant_phone) {
          return res.json({
            success: false,
            message: 'All fields required',
          });
        }

        const item = await FoundItem.findById(req.params.id);
        if (!item)
          return res.json({
            success: false,
            message: 'Item not found',
          });

        res.json({
          success: true,
          message: 'Claim submitted successfully!',
          finder_email: item.finder_email,
          finder_phone: item.finder_phone,
        });
      } catch (err) {
        console.error('Claim item error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // HEALTH CHECK
    app.get('/health', (req, res) =>
      res.json({ status: 'ok', message: 'Server is running' })
    );

    // START SERVER
    const PORT = 3000;
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
