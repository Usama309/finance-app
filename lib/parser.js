/**
 * Smart message parser — replaces GPT for processing WhatsApp messages.
 * Handles natural language expense logging, balance queries, and salary confirmation.
 * Zero cost, zero API keys.
 */

// Category keywords mapping
const CATEGORY_KEYWORDS = {
  food: ["food", "lunch", "dinner", "breakfast", "khana", "biryani", "chai", "tea", "coffee", "snack", "pizza", "burger", "restaurant", "hotel", "eat", "meal", "nashta"],
  fuel: ["fuel", "petrol", "diesel", "gas", "cng", "patrol"],
  bills: ["bill", "bills", "electricity", "bijli", "gas bill", "internet", "wifi", "mobile", "phone", "recharge"],
  transport: ["transport", "uber", "careem", "ride", "taxi", "bus", "fare", "parking"],
  shopping: ["shopping", "clothes", "kapray", "shoes", "amazon", "daraz", "grocery", "groceries", "sabzi", "market"],
  health: ["health", "medical", "medicine", "doctor", "hospital", "dawai", "pharmacy", "checkup"],
  entertainment: ["entertainment", "movie", "cinema", "netflix", "game", "outing", "fun", "trip"],
  other: ["other", "misc"],
};

// Salary confirmation patterns
const SALARY_YES = ["yes", "haan", "ha", "han", "ji", "ji haan", "aa gaye", "aa gai", "mil gaye", "mil gai", "credited", "received", "agaye", "agyi", "salary aagyi", "salary aa gyi"];
const SALARY_NO = ["no", "nahi", "nhi", "abhi nahi", "not yet", "nope"];

// Balance/status query patterns
const STATUS_QUERIES = ["balance", "status", "kitna", "kitne", "remaining", "bacha", "budget", "kharcha", "spent", "summary", "how much", "baki"];

/**
 * Parse a user message and extract intent + data.
 *
 * Supported patterns:
 *   "food 500"
 *   "spent 1200 on fuel"
 *   "500 lunch"
 *   "fuel 1200 shell pump"
 *   "1500 shopping daraz order"
 *   "yes" / "haan" (salary confirmation)
 *   "balance" / "kitna bacha" (status query)
 */
export function parseMessage(text) {
  const msg = text.toLowerCase().trim();

  // 1. Check salary confirmation (exact match or starts-with only — avoid substring false positives)
  if (SALARY_YES.some((p) => msg === p || msg.startsWith(p + " "))) {
    // Only match if there's no number (otherwise it's probably an expense)
    if (!/\d/.test(msg)) return { type: "salary_confirmed" };
  }
  if (SALARY_NO.some((p) => msg === p || msg.startsWith(p + " "))) {
    if (!/\d/.test(msg)) return { type: "salary_not_confirmed" };
  }

  // 2. Try to extract expense first (has priority if a number is present)
  const expense = extractExpense(msg);
  if (expense) {
    return { type: "add_expense", ...expense };
  }

  // 3. Check status query (only if no expense was found)
  if (STATUS_QUERIES.some((q) => msg.includes(q))) {
    return { type: "status_query" };
  }

  // 4. Unknown
  return { type: "unknown" };
}

function extractExpense(msg) {
  // Remove common prefixes
  let clean = msg
    .replace(/^(spent|kharcha|kharch|lagaye|lage|paid)\s*/i, "")
    .replace(/\s*(rupees|rs|pkr|rupaiye)\s*/gi, " ")
    .trim();

  // Find the amount (first number in the message)
  const numMatch = clean.match(/(\d{1,7})/);
  if (!numMatch) return null;

  const amount = parseInt(numMatch[1], 10);
  if (amount <= 0 || amount > 9999999) return null;

  // Find category from remaining words
  const words = clean.replace(numMatch[0], " ").toLowerCase().split(/\s+/).filter(Boolean);
  let category = "other";
  let matchedWord = "";

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (words.some((w) => w.includes(kw) || kw.includes(w))) {
        category = cat;
        matchedWord = kw;
        break;
      }
    }
    if (category !== "other" || matchedWord) break;
  }

  // Build notes from remaining words (exclude category keyword and number)
  const notes = words
    .filter((w) => w !== matchedWord && !/^\d+$/.test(w) && w.length > 1)
    .join(" ")
    .slice(0, 50);

  return {
    amount,
    category,
    notes: notes || category,
    date: new Date().toISOString().split("T")[0],
  };
}

/**
 * Generate a human-friendly reply based on parsed result and financial context.
 */
export function generateReply(parsed, context) {
  const { remaining, dailyBudget, todaySpent, totalSpent, budget, daysLeft } = context;

  switch (parsed.type) {
    case "add_expense": {
      const overDaily = (todaySpent + parsed.amount) > dailyBudget;
      const emoji = overDaily ? "⚠️" : "✅";
      let reply = `${emoji} *${parsed.category.toUpperCase()}* — Rs ${parsed.amount.toLocaleString()} logged!\n\n`;
      reply += `💰 Remaining: Rs ${(remaining - parsed.amount).toLocaleString()}\n`;
      reply += `📊 Today's limit: Rs ${dailyBudget.toLocaleString()}\n`;
      reply += `📅 ${daysLeft} days left`;
      if (overDaily) {
        reply += `\n\n🚨 _You've crossed today's limit! Try to go easy tomorrow._`;
      }
      return reply;
    }

    case "salary_confirmed":
      return `✅ *Salary confirmed!*\n\nGreat — head to the app to allocate your budget:\n💳 Spending\n🚗 Car Fund\n🛡️ Emergency Fund\n\n_The sooner you allocate, the better you'll manage this month._`;

    case "salary_not_confirmed":
      return `👍 No worries — I'll check again tomorrow.\n\n_Let me know when it arrives by saying "haan" or "yes"._`;

    case "status_query":
      return `📊 *Budget Status*\n━━━━━━━━━━━━━━━━\n\n💰 Remaining: Rs ${remaining.toLocaleString()}\n📈 Today's limit: Rs ${dailyBudget.toLocaleString()}\n💸 Total spent: Rs ${totalSpent.toLocaleString()}\n📅 Days left: ${daysLeft}\n\n_Send expenses like "food 500" to log them._`;

    case "unknown":
      return `🤔 Samajh nahi aaya. Try:\n\n• *"food 500"* — log expense\n• *"fuel 1200"* — log fuel\n• *"balance"* — check budget\n• *"yes/haan"* — confirm salary\n\n_Just type the category and amount!_`;

    default:
      return "Type *balance* to check your budget or *food 500* to log an expense.";
  }
}
