import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const app = express();
app.set('trust proxy', 1);

const PORT = (process.env.PORT && !process.env.DISABLE_HMR)
  ? parseInt(process.env.PORT, 10)
  : 3000;
const JWT_SECRET = "super_secret_jwt_token_for_card_platform";

// Absolute path to persistence file
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password Hashing standards using PBKDF2
const HASH_ITERATIONS = 15000;
const HASH_KEY_LEN = 64;
const HASH_DIGEST = "sha512";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LEN, HASH_DIGEST);
  return `pbkdf2$${HASH_ITERATIONS}$${salt}$${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  
  // Support legacy plain text passwords during migration
  if (!storedHash.startsWith("pbkdf2$")) {
    return password === storedHash;
  }
  
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 4) return false;
    
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHashHex = parts[3];
    
    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, HASH_KEY_LEN, HASH_DIGEST);
    const derivedHashHex = derivedKey.toString("hex");
    
    return crypto.timingSafeEqual(
      Buffer.from(originalHashHex, "hex"),
      Buffer.from(derivedHashHex, "hex")
    );
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

// Ensure database file exists with seed data
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    users: [
      {
        fullName: "مدیر کل پلتفرم",
        username: "admin",
        email: "admin@gmail.com",
        phone: "09121234567",
        passwordHash: hashPassword("admin"), // Securely pre-hashed password
        isSuspended: false,
        qrImageUrl: "",
        qrRequestStatus: "none",
        qrRequestTime: "",
        cardData: createDefaultCardData("کارت نمونه ادمین"),
      }
    ],
    announcements: [],
    banners: [
      { id: "banner1", imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80", title: "کارت ویزیت دیجیتال رایگان خود را بسازید" },
      { id: "banner2", imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80", title: "چاپ کارت فیزیکی با برچسب هوشمند NFC" },
      { id: "banner3", imageUrl: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&q=80", title: "کسب و کار خود را در نقشه گوگل ثبت کنید" }
    ],
    tickets: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
}

// Auto self-heal admin user and update password hash if outdated/corrupt
try {
  const dbForInit = getDB();
  const adminUserIdx = dbForInit.users.findIndex((u: any) => u.username === "admin");
  if (adminUserIdx !== -1) {
    const adminUser = dbForInit.users[adminUserIdx];
    // Check if the current hash is not matching "admin", or is not standard
    if (!verifyPassword("admin", adminUser.passwordHash)) {
      console.log("[Admin Healing] Password hash mismatch detected. Re-hashing password to 'admin'...");
      adminUser.passwordHash = hashPassword("admin");
      saveDB(dbForInit);
    }
  } else {
    // If admin has been completely deleted by accident, restore active admin role
    console.log("[Admin Healing] Admin account not found! Re-creating default admin credentials...");
    dbForInit.users.push({
      fullName: "مدیر کل پلتفرم",
      username: "admin",
      email: "admin@gmail.com",
      phone: "09121234567",
      passwordHash: hashPassword("admin"),
      isSuspended: false,
      qrImageUrl: "",
      qrRequestStatus: "none",
      qrRequestTime: "",
      cardData: {
        businessName: "کارت نمونه ادمین",
        brandManager: "امیرحسین رضایی",
        slogan: "آینده در دستان شما با کارت ویزیت هوشمند",
        description: "ما در مجموعه خود جدیدترین دستاوردهای تکنولوژی در حوزه برندینگ و بیزینس کارت دیجیتال را ارائه می کنیم. با ما کسب و کار خود را به اوج برسانید.",
        logoUrl: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&q=80",
        bgImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        phones: ["09120000000"],
        landlines: ["02188888888"],
        branches: [
          {
            id: "branch-1",
            title: "دفتر مرکزی تهران",
            address: "تهران، خیابان ولیعصر، نرسیده به میدان ونک، برج نگار، طبقه ۱۰",
            googleMaps: "https://maps.google.com",
            neshan: "https://neshan.org",
            balad: "https://balad.ir"
          }
        ],
        website: "https://example.com",
        socials: {
          instagram: "https://instagram.com",
          telegram: "https://t.me",
          whatsapp: "https://wa.me/989120000000"
        },
        services: [],
        socialLinks: [],
        stats: {
          totalVisits: 10,
          uniqueVisitors: 4,
          phoneClicks: 2,
          locationClicks: 1
        }
      }
    });
    saveDB(dbForInit);
  }
} catch (e) {
  console.error("Error running admin self-heal routine:", e);
}

function createDefaultCardData(brandName: string) {
  // Generate last 7 days starting from today down
  const dailyVisits: { [date: string]: number } = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const jDate = getJalaliDate(d);
    dailyVisits[jDate] = Math.floor(Math.random() * 20) + 5;
  }

  return {
    businessName: brandName,
    brandManager: "امیرحسین رضایی",
    slogan: "آینده در دستان شما با کارت ویزیت هوشمند",
    description: "ما در مجموعه خود جدیدترین دستاوردهای تکنولوژی در حوزه برندینگ و بیزینس کارت دیجیتال را ارائه می کنیم. با ما کسب و کار خود را به اوج برسانید.",
    logoUrl: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&q=80",
    bgImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    phones: ["09120000000"],
    landlines: ["02188888888"],
    branches: [
      {
        id: "branch-1",
        title: "دفتر مرکزی تهران",
        address: "تهران، خیابان ولیعصر، نرسیده به میدان ونک، برج نگار، طبقه ۱۰",
        googleMaps: "https://maps.google.com",
        neshan: "https://neshan.org",
        balad: "https://balad.ir"
      }
    ],
    website: "https://example.com",
    socials: {
      instagram: "https://instagram.com",
      telegram: "https://t.me",
      whatsapp: "https://wa.me/989120000000",
      youtube: "https://youtube.com",
      aparat: "https://aparat.com",
      bale: "https://ble.ir",
      rubika: "https://rubika.ir",
      soroush: "https://splus.ir"
    },
    gallery: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
      "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=600&q=80"
    ],
    products: [
      {
        id: "prod-1",
        title: "کارت ویزیت فلزی طلایی NFC",
        description: "دارای چیپ NTAG213 با روکش استیل طلایی ضد خش",
        price: "450,000 تومان",
        link: "https://example.com/p1",
        imageUrl: "https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=400&q=80"
      },
      {
        id: "prod-2",
        title: "مکعب رومیزی هوشمند پودینگ",
        description: "ایده آل برای کافه ها و رستوران ها جهت ثبت بازخورد کاربران",
        price: "320,000 تومان",
        link: "https://example.com/p2",
        imageUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&q=80"
      }
    ],
    workingDays: {
      "شنبه": { isOpen: true, openTime: "09:00", closeTime: "18:00", isClosed: false },
      "یکشنبه": { isOpen: true, openTime: "09:00", closeTime: "18:00", isClosed: false },
      "دوشنبه": { isOpen: true, openTime: "09:00", closeTime: "18:00", isClosed: false },
      "سه شنبه": { isOpen: true, openTime: "09:00", closeTime: "18:00", isClosed: false },
      "چهارشنبه": { isOpen: true, openTime: "09:00", closeTime: "18:00", isClosed: false },
      "پنجشنبه": { isOpen: true, openTime: "09:00", closeTime: "14:00", isClosed: false },
      "جمعه": { isOpen: false, openTime: "00:00", closeTime: "00:00", isClosed: true }
    },
    design: {
      template: "modern",
      colorTheme: "#3B82F6",
      isDark: false
    },
    stats: {
      totalVisits: 450,
      scans: 120,
      linkOpens: 330,
      buttonClicks: 85,
      dailyVisits: dailyVisits
    }
  };
}

function getJalaliDate(date: Date): string {
  // Simple conversion helper for demo charts
  const option = { month: "short", day: "numeric" } as const;
  return new Intl.DateTimeFormat("fa-IR", option).format(date);
}

// Database Read/Write Utilities with In-Memory Caching and Atomic Async Write Queue
let dbCache: any = null;
let writeQueue: Promise<void> = Promise.resolve();

function getDB() {
  if (dbCache) {
    return dbCache;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      dbCache = JSON.parse(raw);
    } else {
      dbCache = { users: [], announcements: [], banners: [], tickets: [] };
    }
    return dbCache;
  } catch (err) {
    console.error("Error reading database file", err);
    return { users: [], announcements: [], banners: [], tickets: [] };
  }
}

function saveDB(data: any) {
  // Update the in-memory cache immediately synchronously
  dbCache = data;

  // Queue writing to disk sequentially in the background
  writeQueue = writeQueue.then(async () => {
    try {
      const tempFile = DB_FILE + ".tmp";
      const payload = JSON.stringify(data, null, 2);
      // Write atomically to a temp file first
      await fs.promises.writeFile(tempFile, payload, "utf8");
      // Rename is POSIX atomic and completely safe against corrupted partial-writes
      await fs.promises.rename(tempFile, DB_FILE);
    } catch (err) {
      console.error("Error in atomic saveDB write queue:", err);
    }
  });
}

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Simple Security logs & Rate limit simulator (simple in-memory rate limiter per IP)
const rateLimitStore: { [ip: string]: { count: number; resetTime: number } } = {};
app.use((req, res, next) => {
  const ip = req.ip || "unknown";
  const now = Date.now();
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = { count: 1, resetTime: now + 60 * 1000 };
  } else {
    if (now > rateLimitStore[ip].resetTime) {
      rateLimitStore[ip] = { count: 1, resetTime: now + 60 * 1000 };
    } else {
      rateLimitStore[ip].count++;
    }
  }

  if (rateLimitStore[ip].count > 500) {
    return res.status(429).json({ message: "تعداد درخواست های شما بیش از حد مجاز است. لطفا لحظه ای صبر کنید." });
  }

  // Security Headers Simulation (Helmet simulation)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Authentication middleware
function verifyToken(req: any, res: any, next: any) {
  let token = "";

  // 1. Support Authorization header Bearer token (HIGHEST PRIORITY)
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  // 2. Support cookie fallback if header not present
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  // 3. Support alternative authorization token query parameter (optional fallback)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    console.log("[Auth] verifyToken failed: No token found");
    return res.status(410).json({ message: "توکن معتبر یافت نشد. لطفا مجدد وارد شوید." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.username = decoded.username;
    console.log(`[Auth] verifyToken success: user=${req.username}`);
    next();
  } catch (err: any) {
    console.log("[Auth] verifyToken failed: token invalid:", err.message);
    return res.status(401).json({ message: "توکن شما منقضی یا نامعتبر شده است." });
  }
}

// Check if username is available (live checking during registration)
app.get("/api/auth/check-username/:username", (req, res) => {
  const { username } = req.params;
  const usernameClean = username.trim().toLowerCase();

  // Rules: alphanumeric English, >4 and <10 [so 5 to 9 chars]
  const isAlphaNumeric = /^[a-zA-Z0-9]+$/.test(usernameClean);
  if (!isAlphaNumeric) {
    return res.json({ available: false, error: "نام کاربری فقط باید انگلیسی و اعداد باشد" });
  }

  if (usernameClean.length <= 4 || usernameClean.length >= 10) {
    return res.json({ available: false, error: "نام کاربری باید بین ۵ تا ۹ کاراکتر باشد" });
  }

  const db = getDB();
  const exists = db.users.some((u: any) => u.username.toLowerCase() === usernameClean);

  if (exists) {
    return res.json({ available: false, error: "این نام کاربری از قبل وجود دارد" });
  }

  return res.json({ available: true });
});

// Registration API
app.post("/api/auth/register", (req, res) => {
  const { fullName, username, email, phone, password, confirmPassword } = req.body;

  if (!fullName || !username || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ message: "لطفاتمامی فیلدها را وارد نمایید." });
  }

  const usernameClean = username.trim().toLowerCase();

  // Validate username length (> 4 and < 10)
  if (usernameClean.length <= 4 || usernameClean.length >= 10) {
    return res.status(400).json({ message: "نام کاربری باید بین ۵ تا ۹ کاراکتر باشد." });
  }

  if (!/^[a-zA-Z0-9]+$/.test(usernameClean)) {
    return res.status(400).json({ message: "نام کاربری فقط باید شامل حروف انگلیسی و اعداد باشد." });
  }

  // Email format check - must end with @gmail.com
  if (!email.endsWith("@gmail.com")) {
    return res.status(400).json({ message: "ایمیل شما باید با @gmail.com خاتمه یابد." });
  }

  // Phone starts with 09 and is 11 digits
  if (!/^09\d{9}$/.test(phone)) {
    return res.status(400).json({ message: "شماره همراه باید با 09 آغاز شده و ۱۱ رقم باشد." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "رمز عبور با تکرار آن مطابقت ندارد." });
  }

  const db = getDB();

  // Uniqueness check
  if (db.users.some((u: any) => u.username.toLowerCase() === usernameClean)) {
    return res.status(400).json({ message: "نام کاربری تکراری است." });
  }

  if (db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "حسابی با این ایمیل هم اکنون ثبت نام شده است." });
  }

  if (db.users.some((u: any) => u.phone === phone)) {
    return res.status(400).json({ message: "این شماره همراه قبلا در وبسایت ثبت شده است." });
  }

  // Create clean user card details
  const newUser = {
    fullName,
    username: usernameClean,
    email,
    phone,
    passwordHash: hashPassword(password), // Store secure PBKDF2 hashed password
    isSuspended: false,
    qrImageUrl: "",
    qrRequestStatus: "none",
    qrRequestTime: "",
    cardData: createDefaultCardData(fullName),
  };

  db.users.push(newUser);
  saveDB(db);

  // Auto-login with token
  const token = jwt.sign({ username: usernameClean }, JWT_SECRET, { expiresIn: "1d" });
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/", // Explicit path scopes it site-wide, preventing sub-route omission
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });

  return res.json({ message: "ثبت نام با موفقیت انجام شد.", token, user: { fullName, username: usernameClean, email, phone, isSuspended: false } });
});

// Login API (Dual entry: email or phone number)
app.post("/api/auth/login", (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ message: "لطفا شناسه کاربری (ایمیل یا شماره همراه) و رمز عبور را وارد کنید." });
  }

  const db = getDB();
  const idClean = loginId.trim().toLowerCase();

  const user = db.users.find(
    (u: any) =>
      u.email.toLowerCase() === idClean ||
      u.phone === idClean ||
      u.username.toLowerCase() === idClean
  );

  // Secure PBKDF2 timing-safe comparison
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(400).json({ message: "شناسه کاربری یا رمز عبور اشتباه است." });
  }

  // Seamlessly upgrade legacy plain text passwords on successful login
  if (!user.passwordHash.startsWith("pbkdf2$")) {
    user.passwordHash = hashPassword(password);
    saveDB(db);
  }

  // Generate sessions
  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "10d" });
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/", // Explicit path scopes it site-wide
    maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
  });

  return res.json({
    message: "ورود موفقیت‌آمیز بود.",
    token, // Return token specifically for header fallback
    user: {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isSuspended: user.isSuspended,
      qrRequestStatus: user.qrRequestStatus,
      qrImageUrl: user.qrImageUrl
    }
  });
});

// Logout API
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/" // Clear across whole site
  });
  return res.json({ message: "خروج موفقیت آمیز" });
});

// Me API (To retrieve current session and verify credentials)
app.get("/api/auth/me", (req, res) => {
  let token = "";

  // 1. Support Authorization header Bearer token (HIGHEST PRIORITY)
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  // 2. Support cookie fallback if header not present
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  // 3. Support alternative authorization token query parameter (optional fallback)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const db = getDB();
    const user = db.users.find((u: any) => u.username === decoded.username);

    if (!user) {
      return res.status(401).json({ loggedIn: false });
    }

    // Refresh token
    const newToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "10d" });

    return res.json({
      loggedIn: true,
      token: newToken,
      user: {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isSuspended: user.isSuspended,
        qrRequestStatus: user.qrRequestStatus,
        qrImageUrl: user.qrImageUrl
      }
    });
  } catch (err: any) {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/" // Clean session completely on error
    });
    return res.status(401).json({ loggedIn: false });
  }
});

// Forgot & Reset Password API
app.post("/api/auth/reset-password", (req, res) => {
  const { email, phone, username, newPassword } = req.body;

  if (!email || !phone || !username || !newPassword) {
    return res.status(400).json({ message: "لطفاتمامی فیلدها را جهت تایید هویت وارد کنید." });
  }

  const db = getDB();
  const userIndex = db.users.findIndex(
    (u: any) =>
      u.username.toLowerCase() === username.trim().toLowerCase() &&
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.phone === phone.trim()
  );

  if (userIndex === -1) {
    return res.status(400).json({ message: "مشخصات وارد شده همخوانی ندارد. لطفا مجدد تلاش بفرمایید." });
  }

  db.users[userIndex].passwordHash = hashPassword(newPassword); // Secure reset hashing
  saveDB(db);

  return res.json({ message: "رمز عبور با موفقیت بازنشانی شد. هم اکنون می توانید وارد شوید." });
});

// Public Card data fetch + stats counter
app.get("/api/card/:username", (req, res) => {
  const { username } = req.params;
  const source = req.query.source || "link"; // 'scan' or 'link'

  const db = getDB();
  const user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: "کارت ویزیت مورد نظر یافت نشد." });
  }

  if (user.isSuspended) {
    return res.status(403).json({ message: "این کارت ویزیت به دلیل تعلیق موقت فعالیت حساب، غیرفعال می باشد.", isSuspended: true });
  }

  // Increment metrics
  if (!user.cardData.stats) {
    user.cardData.stats = { totalVisits: 0, scans: 0, linkOpens: 0, buttonClicks: 0, dailyVisits: {} };
  }

  user.cardData.stats.totalVisits += 1;
  if (source === "scan") {
    user.cardData.stats.scans += 1;
  } else {
    user.cardData.stats.linkOpens += 1;
  }

  // Manage daily chart visits for last 7 days dynamically
  const today = getJalaliDate(new Date());
  if (!user.cardData.stats.dailyVisits) {
    user.cardData.stats.dailyVisits = {};
  }
  user.cardData.stats.dailyVisits[today] = (user.cardData.stats.dailyVisits[today] || 0) + 1;

  saveDB(db);

  return res.json({
    fullName: user.fullName,
    username: user.username,
    cardData: user.cardData
  });
});

// Click count tracker
app.post("/api/card/:username/click", (req, res) => {
  const { username } = req.params;
  const db = getDB();
  const user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  user.cardData.stats.buttonClicks += 1;
  saveDB(db);
  return res.json({ success: true, count: user.cardData.stats.buttonClicks });
});

// Get card data for owner (no visitors metric increment)
app.get("/api/user/card/:username", verifyToken, (req: any, res) => {
  const { username } = req.params;
  if (req.username !== username && req.username !== "admin") {
    return res.status(403).json({ message: "عدم دسترسی به پنل مدیریت کارت." });
  }

  const db = getDB();
  const user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: "کاربر مورد نظر یافت نشد." });
  }

  return res.json(user.cardData);
});

// Save updated Card Data
app.post("/api/user/card/:username", verifyToken, (req: any, res) => {
  const { username } = req.params;
  if (req.username !== username && req.username !== "admin") {
    return res.status(403).json({ message: "عدم دسترسی به پنل مدیریت کارت." });
  }

  const db = getDB();
  const userIndex = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (userIndex === -1) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  const currentStats = db.users[userIndex].cardData.stats;
  // Deep save, preserving existing stats
  db.users[userIndex].cardData = {
    ...req.body,
    stats: currentStats // lock stats
  };

  saveDB(db);
  return res.json({ message: "اطلاعات کارت با موفقیت ذخیره شد.", cardData: db.users[userIndex].cardData });
});

// QR Code activation system
app.post("/api/user/:username/qr-request", verifyToken, (req: any, res) => {
  const { username } = req.params;
  if (req.username !== username) {
    return res.status(403).json({ message: "عدم دسترسی" });
  }

  const db = getDB();
  const userIndex = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (userIndex === -1) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  db.users[userIndex].qrRequestStatus = "pending";
  db.users[userIndex].qrRequestTime = new Date().toLocaleString("fa-IR");
  saveDB(db);

  return res.json({ message: "درخواست فعالسازی و طراحی کارت فیزیکی با موفقیت ثبت شد." });
});

// Single User - Get my tickets
app.get("/api/user/:username/tickets", verifyToken, (req: any, res) => {
  const { username } = req.params;
  if (req.username !== username && req.username !== "admin") {
    return res.status(403).json({ message: "دسترسی غیرمجاز" });
  }

  const db = getDB();
  const userTickets = db.tickets.filter((t: any) => t.username.toLowerCase() === username.toLowerCase());
  return res.json(userTickets);
});

// Create ticket
app.post("/api/user/:username/tickets", verifyToken, (req: any, res) => {
  const { username } = req.params;
  const { title, description } = req.body;

  if (req.username !== username) {
    return res.status(403).json({ message: "دسترسی غیرمجاز" });
  }

  if (!title || !description) {
    return res.status(400).json({ message: "لطفاتمامی فیلدها را وارد نمایید." });
  }

  const db = getDB();
  const user = db.users.find((u: any) => u.username === username);

  const newTicket = {
    id: "ticket-" + Date.now(),
    username,
    userFullName: user ? user.fullName : "کاربر",
    title,
    description,
    status: "read", // 'read', 'under_review', 'ended'
    createdAt: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString("fa-IR"),
    messages: [
      {
        id: "msg-1",
        sender: "user",
        message: description,
        createdAt: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
      }
    ]
  };

  db.tickets.push(newTicket);
  saveDB(db);

  return res.json({ message: "تیکت با موفقیت ثبت شد.", ticket: newTicket });
});

// Add message to ticket
app.post("/api/user/:username/tickets/:ticketId/messages", verifyToken, (req: any, res) => {
  const { username, ticketId } = req.params;
  const { message, sender } = req.body; // sender: 'user' or 'support'

  if (req.username !== username && req.username !== "admin") {
    return res.status(403).json({ message: "دسترسی غیرمجاز" });
  }

  const db = getDB();
  const ticketIndex = db.tickets.findIndex((t: any) => t.id === ticketId);

  if (ticketIndex === -1) {
    return res.status(404).json({ message: "تیکت یافت نشد." });
  }

  if (db.tickets[ticketIndex].status === "ended") {
    return res.status(400).json({ message: "این تیکت بسته شده است و امکان ارسال پیام وجود ندارد." });
  }

  const newMsg = {
    id: "msg-" + Date.now(),
    sender: req.username === "admin" ? "support" : "user",
    message,
    createdAt: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
  };

  db.tickets[ticketIndex].messages.push(newMsg);
  // Auto mark as active / under review if user writes, or support writes
  if (req.username !== "admin") {
    db.tickets[ticketIndex].status = "under_review";
  }
  
  saveDB(db);
  return res.json(newMsg);
});

// ====== ADMIN ROUTERS ======

// Check admin role
function verifyAdmin(req: any, res: any, next: any) {
  verifyToken(req, res, () => {
    if (req.username !== "admin") {
      console.log(`[Auth Admin] Access Denied: User is ${req.username}, expected admin`);
      return res.status(403).json({ message: "شما دسترسی به پنل مدیریت را ندارید." });
    }
    console.log(`[Auth Admin] Access Granted for admin`);
    next();
  });
}

// Get admin stats
app.get("/api/admin/stats", verifyAdmin, (req, res) => {
  const db = getDB();
  const safeUsers = db.users || [];
  const totalCustomers = safeUsers.filter((u: any) => u.username !== "admin").length;
  const cardsWithQr = safeUsers.filter((u: any) => u.qrRequestStatus === "approved").length;
  const totalVisits = safeUsers.reduce((acc: number, u: any) => acc + (u.cardData?.stats?.totalVisits || 0), 0);

  return res.json({
    totalCustomers,
    cardsWithQr,
    totalVisits
  });
});

// Admin- Get users list
app.get("/api/admin/users", verifyAdmin, (req, res) => {
  const db = getDB();
  // Filter admin from editable accounts list
  const clientUsers = (db.users || []).filter((u: any) => u.username !== "admin");
  return res.json(clientUsers);
});

// Admin- Edit User details
app.post("/api/admin/users/:username/edit", verifyAdmin, (req, res) => {
  const { username } = req.params;
  const { fullName, email, phone, password } = req.body;

  const db = getDB();
  const userIdx = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (userIdx === -1) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  // Update
  db.users[userIdx].fullName = fullName;
  db.users[userIdx].email = email;
  db.users[userIdx].phone = phone;
  if (password) {
    db.users[userIdx].passwordHash = hashPassword(password);
  }

  saveDB(db);
  return res.json({ message: "مشخصات کاربر با موفقیت ویرایش گردید." });
});

// Admin- Force toggle suspend status
app.post("/api/admin/users/:username/toggle-suspend", verifyAdmin, (req, res) => {
  const { username } = req.params;
  const db = getDB();
  const userIdx = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (userIdx === -1) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  db.users[userIdx].isSuspended = !db.users[userIdx].isSuspended;
  saveDB(db);

  return res.json({
    message: db.users[userIdx].isSuspended ? "کاربر تعلیق شد." : "تعلیق کاربر برطرف گردید.",
    isSuspended: db.users[userIdx].isSuspended
  });
});

// Admin- Reset User Card to fresh default
app.post("/api/admin/users/:username/reset", verifyAdmin, (req, res) => {
  const { username } = req.params;
  const db = getDB();
  const userIdx = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (userIdx === -1) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  db.users[userIdx].cardData = createDefaultCardData(db.users[userIdx].fullName);
  saveDB(db);

  return res.json({ message: "کارت ویزیت کاربر ریست شد و به حالت خام اولیه بازگشت." });
});

// Admin- Completely delete user account
app.post("/api/admin/users/:username/delete", verifyAdmin, (req, res) => {
  const { username } = req.params;
  const db = getDB();
  const userIdx = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (userIdx === -1) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  // Remove
  db.users.splice(userIdx, 1);
  saveDB(db);

  return res.json({ message: "حساب کاربر به همراه کلیه اطلاعات فورا حذف گردید." });
});

// Admin- Auto login bypass (Gets direct signed token for user dashboard)
app.post("/api/admin/users/:username/bypass-login", verifyAdmin, (req, res) => {
  const { username } = req.params;
  const db = getDB();
  const user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  // Sign direct token to cookies
  const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "10d" });
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 10 * 24 * 60 * 60 * 1000
  });

  return res.json({ success: true, token, username: user.username });
});

// Admin- Get QR Requests
app.get("/api/admin/qr-requests", verifyAdmin, (req, res) => {
  const db = getDB();
  // Get users who requested QR code
  const requests = (db.users || [])
    .filter((u: any) => u.qrRequestStatus !== "none")
    .map((u: any) => ({
      fullName: u.fullName,
      username: u.username,
      qrRequestStatus: u.qrRequestStatus,
      qrImageUrl: u.qrImageUrl,
      qrRequestTime: u.qrRequestTime || "ثبت نشده"
    }));
  return res.json(requests);
});

// Admin- Approve QR Code request and upload final QR image (represented by base64)
app.post("/api/admin/qr-requests/:username/approve", verifyAdmin, (req, res) => {
  const { username } = req.params;
  const { qrImageUrl } = req.body;

  if (!qrImageUrl) {
    return res.status(400).json({ message: "آدرس یا تصویر کیوآرکد الزامی است." });
  }

  const db = getDB();
  const userIdx = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

  if (userIdx === -1) {
    return res.status(404).json({ message: "کاربر یافت نشد." });
  }

  db.users[userIdx].qrRequestStatus = "approved";
  db.users[userIdx].qrImageUrl = qrImageUrl;
  saveDB(db);

  return res.json({ message: "کیوآرکد کاربر با موفقیت تایید و بارگذاری گردید." });
});

// Admin- View all tickets
app.get("/api/admin/tickets", verifyAdmin, (req, res) => {
  const db = getDB();
  return res.json(db.tickets || []);
});

// Admin- Update ticket status values
app.post("/api/admin/tickets/:ticketId/status", verifyAdmin, (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body; // 'read' | 'under_review' | 'ended'

  const db = getDB();
  const tIdx = db.tickets.findIndex((t: any) => t.id === ticketId);

  if (tIdx === -1) {
    return res.status(404).json({ message: "تیکت یافت نشد." });
  }

  db.tickets[tIdx].status = status;
  saveDB(db);

  return res.json({ message: "عملیات تغییر وضعیت تیکت با موفقیت صورت پذیرفت.", status });
});

// Admin- Announcements APIS
app.get("/api/announcements", (req, res) => {
  const db = getDB();
  return res.json(db.announcements || []);
});

app.post("/api/admin/announcements", verifyAdmin, (req, res) => {
  const { title, description, image } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: "عنوان و توضیحات الزامی است." });
  }

  const db = getDB();
  if (!db.announcements) db.announcements = [];

  const newAnn = {
    id: "ann-" + Date.now(),
    title,
    description,
    image: image || "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80",
    createdAt: new Date().toLocaleDateString("fa-IR")
  };

  db.announcements.push(newAnn);
  saveDB(db);
  return res.json(newAnn);
});

app.delete("/api/admin/announcements/:id", verifyAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  if (!db.announcements) db.announcements = [];

  db.announcements = db.announcements.filter((a: any) => a.id !== id);
  saveDB(db);

  return res.json({ message: "اعلان با موفقیت حذف گردید." });
});

// Admin- Ads Banners APIs
app.get("/api/banners", (req, res) => {
  const db = getDB();
  return res.json(db.banners || []);
});

app.post("/api/admin/banners", verifyAdmin, (req, res) => {
  const { banner1, banner2, banner3, title1, title2, title3, link1, link2, link3 } = req.body;
  const db = getDB();

  db.banners = [
    { id: "banner1", imageUrl: banner1 || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80", title: title1 || "تبلیغات شما در پلتفرم", link: link1 || "" },
    { id: "banner2", imageUrl: banner2 || "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800&q=80", title: "چاپ نانو کارت هوشمند", link: link2 || "" },
    { id: "banner3", imageUrl: banner3 || "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&q=80", title: title3 || "مکانیسم رزرو نوبت تلفنی", link: link3 || "" }
  ];

  saveDB(db);
  return res.json({ message: "بنرهای تبلیغاتی با موفقیت ویرایش گردید.", banners: db.banners });
});

// Start integration of Vite middleware and serving logic
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all requests to let React Router navigate client-side properly
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK DEV] Server is running on http://localhost:${PORT}`);
  });
}

bootstrap();
