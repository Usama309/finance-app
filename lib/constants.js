// Default monthly income
export const DEFAULT_INCOME = 300000;

// Fixed monthly obligations — system knows which months they apply
export const FIXED_EXPENSES = {
  rent:           { label: "House Rent",                  amount: 20000,  everyMonth: true },
  kameeti:        { label: "Kameeti",                     amount: 30000,  everyMonth: true },
  iphone:         { label: "iPhone Installment",          amount: 21500,  everyMonth: true },
  employeeSalary: { label: "Employee Salary",             amount: 40000,  everyMonth: true },
  gymWifiOther:   { label: "GYM / WiFi / Internet / Other", amount: 10000, everyMonth: true },
  saqib:          { label: "Saqib Payment",               amount: 100000, months: [5, 6, 7, 8, 9, 10, 11, 12] },
  hunzla:         { label: "Hunzla Payment",              amount: 150000, months: [4] },
};

// Expense categories
export const CATEGORIES = [
  { id: "food",          label: "Food",          icon: "🍔", color: "#f97316" },
  { id: "fuel",          label: "Fuel",          icon: "⛽", color: "#3b82f6" },
  { id: "bills",         label: "Bills",         icon: "📄", color: "#8b5cf6" },
  { id: "transport",     label: "Transport",     icon: "🚗", color: "#06b6d4" },
  { id: "shopping",      label: "Shopping",      icon: "🛍️", color: "#ec4899" },
  { id: "health",        label: "Health",        icon: "💊", color: "#10b981" },
  { id: "entertainment", label: "Entertainment", icon: "🎬", color: "#f59e0b" },
  { id: "other",         label: "Other",         icon: "📌", color: "#6b7280" },
];

// Savings targets
export const SAVINGS_TARGETS = {
  carFund:       { label: "Car Repair Fund",  target: 200000, icon: "🚗" },
  emergencyFund: { label: "Emergency Fund",   target: 150000, icon: "🛡️" },
};

// Suggested allocation split (% of remaining after fixed expenses)
export const SUGGESTED_SPLITS = {
  spending:      60,
  carFund:       25,
  emergencyFund: 15,
};

// Month names for display
export const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
