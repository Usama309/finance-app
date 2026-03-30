/**
 * CashGuard Backend Server — 100% FREE
 *
 * - WhatsApp via whatsapp-web.js (your own WhatsApp, QR code login)
 * - Smart parser instead of GPT (zero API cost)
 * - Daily summary cron job
 * - Salary day reminder on 8th
 * - Express API for frontend sync
 */

import express from "express";
import cron from "node-cron";
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseMessage, generateReply } from "./lib/parser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "finance-data.json");

const PORT = process.env.PORT || 3001;
const MY_NUMBER = "923208089676@c.us"; // Your WhatsApp number in international format

// ═══════════════════════════════════════════════════════════════
//  DATA HELPERS
// ═══════════════════════════════════════════════════════════════

function ensureDir() {
  const d = path.join(__dirname, "data");
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function loadData() {
  ensureDir();
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")); }
  catch { return { months: {}, savings: { carFund: { total: 0, contributions: [] }, emergencyFund: { total: 0, contributions: [] } }, settings: { disciplineMode: false, salaryConfirmed: {} } }; }
}

function saveData(data) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function monthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

function getMonth(data, mk) {
  if (!data.months[mk]) data.months[mk] = { income: 300000, allocated: false, allocations: { spending: 0, carFund: 0, emergencyFund: 0 }, expenses: [] };
  return data.months[mk];
}

// Fixed expenses
const FIXED = {
  rent:           { label: "House Rent",         amount: 20000,  every: true },
  kameeti:        { label: "Kameeti",            amount: 30000,  every: true },
  iphone:         { label: "iPhone Installment", amount: 21500,  every: true },
  employeeSalary: { label: "Employee Salary",    amount: 40000,  every: true },
  saqib:          { label: "Saqib Payment",      amount: 100000, months: [5,6,7,8,9,10,11,12] },
  hunzla:         { label: "Hunzla Payment",     amount: 150000, months: [4] },
};

function fixedTotal(m) {
  let t = 0;
  for (const e of Object.values(FIXED)) if (e.every || (e.months && e.months.includes(m))) t += e.amount;
  return t;
}

function getFinancialContext(data) {
  const now = new Date();
  const mk = monthKey();
  const md = getMonth(data, mk);
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const dim = new Date(now.getFullYear(), m, 0).getDate();
  const todayStr = now.toISOString().split("T")[0];

  const totalSpent = md.expenses.reduce((s, e) => s + e.amount, 0);
  const todaySpent = md.expenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);
  const budget = md.allocations.spending || 0;
  const remaining = Math.max(budget - totalSpent, 0);
  const daysLeft = Math.max(dim - d, 1);
  const dailyBudget = Math.floor(remaining / daysLeft);

  return { remaining, dailyBudget, todaySpent, totalSpent, budget, daysLeft, mk, md, month: m, day: d, dim };
}

// ═══════════════════════════════════════════════════════════════
//  WHATSAPP CLIENT (FREE — uses your own WhatsApp)
// ═══════════════════════════════════════════════════════════════

let whatsappReady = false;

const wa = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, ".wwebjs_auth") }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
});

wa.on("qr", (qr) => {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  📱 SCAN THIS QR CODE WITH YOUR WHATSAPP         ║");
  console.log("║  Open WhatsApp → Settings → Linked Devices → +   ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  qrcode.generate(qr, { small: true });
});

wa.on("ready", () => {
  whatsappReady = true;
  console.log("\n✅ WhatsApp connected! Messages will be sent to your number.\n");
});

wa.on("auth_failure", (msg) => {
  console.error("❌ WhatsApp auth failed:", msg);
});

wa.on("disconnected", (reason) => {
  whatsappReady = false;
  console.log("⚠️  WhatsApp disconnected:", reason);
});

// Handle incoming messages
wa.on("message", async (msg) => {
  // Only process messages from our own number (self-chat)
  // or messages sent TO our number
  const from = msg.from;
  const body = msg.body?.trim();
  if (!body) return;

  // Process messages from our own number or from our number's chat
  const isFromMe = from === MY_NUMBER || msg.fromMe;
  if (!isFromMe && from !== MY_NUMBER) return;

  console.log(`\n📩 WhatsApp: "${body}"`);

  const data = loadData();
  const ctx = getFinancialContext(data);
  const parsed = parseMessage(body);

  // Process actions
  if (parsed.type === "add_expense") {
    const mk = monthKey();
    const md = getMonth(data, mk);
    md.expenses.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      amount: parsed.amount,
      category: parsed.category,
      notes: parsed.notes || "",
      date: parsed.date,
      timestamp: new Date().toISOString(),
      source: "whatsapp",
    });
    saveData(data);
    console.log(`   💰 Expense: Rs ${parsed.amount} (${parsed.category})`);
  } else if (parsed.type === "salary_confirmed") {
    data.settings.salaryConfirmed[ctx.mk] = true;
    saveData(data);
    console.log(`   ✅ Salary confirmed for ${ctx.mk}`);
  }

  const reply = generateReply(parsed, ctx);
  await msg.reply(reply);
  console.log(`   📤 Replied`);
});

// Send message helper
async function sendWhatsApp(text) {
  if (!whatsappReady) {
    console.log(`\n[WhatsApp Not Ready] Would send:\n${text}\n`);
    return false;
  }
  try {
    await wa.sendMessage(MY_NUMBER, text);
    console.log(`[WhatsApp] Sent: ${text.slice(0, 60)}...`);
    return true;
  } catch (err) {
    console.error("[WhatsApp] Send failed:", err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  DAILY SUMMARY
// ═══════════════════════════════════════════════════════════════

async function sendDailySummary() {
  const data = loadData();
  const ctx = getFinancialContext(data);
  const { remaining, dailyBudget, totalSpent, budget, daysLeft, md, day } = ctx;

  // Yesterday's spend
  const yd = new Date();
  yd.setDate(day - 1);
  const ydStr = yd.toISOString().split("T")[0];
  const ydTotal = md.expenses.filter(e => e.date === ydStr).reduce((s, e) => s + e.amount, 0);

  const pct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
  const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));

  let status = "✅";
  if (pct > 90) status = "🚨";
  else if (pct > 70) status = "⚠️";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const msg = `${status} *CashGuard Daily Report*
━━━━━━━━━━━━━━━━━━

📅 ${dateStr}

💰 *Remaining:* Rs ${remaining.toLocaleString()}
📊 *Budget:* ${bar} ${pct}%
📈 *Today's Limit:* Rs ${dailyBudget.toLocaleString()}

${ydTotal > 0 ? `Yesterday: Rs ${ydTotal.toLocaleString()} spent` : "✨ Yesterday was a no-spend day!"}

📅 ${daysLeft} days left this month

━━━━━━━━━━━━━━━━━━
_Reply "food 500" or "fuel 1200" to log._
_Reply "balance" for full status._`;

  await sendWhatsApp(msg);
}

// ═══════════════════════════════════════════════════════════════
//  SALARY DAY CHECK
// ═══════════════════════════════════════════════════════════════

async function checkSalaryDay() {
  const data = loadData();
  const mk = monthKey();
  if (data.settings.salaryConfirmed?.[mk]) return;

  const msg = `💰 *Salary Day Check*
━━━━━━━━━━━━━━━━━━

Has your salary been credited?

Reply *"yes"* or *"haan"* to confirm.
Reply *"no"* or *"nahi"* if not yet.

_Once confirmed, allocate your budget in the app!_`;

  await sendWhatsApp(msg);
}

// ═══════════════════════════════════════════════════════════════
//  CRON JOBS
// ═══════════════════════════════════════════════════════════════

// Daily summary at 9:00 AM PKT (4:00 AM UTC)
cron.schedule("0 9 * * *", () => {
  console.log("[Cron] Daily summary...");
  sendDailySummary();
});

// Salary check on 8th at 10:00 AM PKT
cron.schedule("0 10 8 * *", () => {
  console.log("[Cron] Salary day check...");
  checkSalaryDay();
});

// ═══════════════════════════════════════════════════════════════
//  EXPRESS API
// ═══════════════════════════════════════════════════════════════

const app = express();
app.use(express.json());

// CORS for frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/api/data", (req, res) => res.json(loadData()));
app.post("/api/data", (req, res) => { saveData(req.body); res.json({ ok: true }); });
app.post("/api/send-daily", async (req, res) => { await sendDailySummary(); res.json({ ok: true }); });
app.post("/api/send-salary-check", async (req, res) => { await checkSalaryDay(); res.json({ ok: true }); });
app.get("/api/whatsapp-status", (req, res) => res.json({ connected: whatsappReady }));

// Test the parser from the API
app.post("/api/test-parse", (req, res) => {
  const { message } = req.body;
  const data = loadData();
  const ctx = getFinancialContext(data);
  const parsed = parseMessage(message);
  const reply = generateReply(parsed, ctx);
  res.json({ parsed, reply });
});

// ═══════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n🛡️  CashGuard Backend — http://localhost:${PORT}`);
  console.log(`   ✅ 100% FREE — No API keys needed\n`);
  console.log(`   GET  /api/data            — Get finance data`);
  console.log(`   POST /api/data            — Save finance data`);
  console.log(`   POST /api/send-daily      — Trigger daily summary`);
  console.log(`   POST /api/test-parse      — Test message parser`);
  console.log(`   GET  /api/whatsapp-status — Check WhatsApp connection\n`);
  console.log(`   ⏰  Cron: Daily summary at 9:00 AM`);
  console.log(`   ⏰  Cron: Salary check on 8th at 10:00 AM\n`);
  console.log(`   📱 Initializing WhatsApp... scan QR code below:\n`);
});

// Initialize WhatsApp
wa.initialize().catch((err) => {
  console.error("WhatsApp init error:", err.message);
  console.log("\n⚠️  WhatsApp failed to start. The app still works without it.");
  console.log("   You can use the web UI normally and set up WhatsApp later.\n");
});
