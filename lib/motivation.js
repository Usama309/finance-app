/** Motivational messages for financial discipline. */
const MESSAGES = [
  { text: "Every rupee saved today is freedom tomorrow.", icon: "💪" },
  { text: "Discipline is choosing between what you want now and what you want most.", icon: "🎯" },
  { text: "Small daily improvements lead to stunning results.", icon: "📈" },
  { text: "You don't have to be great to start, but you have to start to be great.", icon: "🚀" },
  { text: "Financial freedom is a journey, not a destination. Keep going.", icon: "🛤️" },
  { text: "The best time to save was yesterday. The second best time is now.", icon: "⏰" },
  { text: "Your future self will thank you for the discipline you show today.", icon: "🙏" },
  { text: "A budget is telling your money where to go instead of wondering where it went.", icon: "🗺️" },
  { text: "Don't go broke trying to look rich. Stay disciplined.", icon: "🔒" },
  { text: "Wealth is not about having a lot of money — it's about having a lot of options.", icon: "✨" },
  { text: "Pay yourself first. Your savings are your salary to your future.", icon: "🏦" },
  { text: "It's not your salary that makes you rich, it's your spending habits.", icon: "📊" },
  { text: "Beware of little expenses. A small leak will sink a great ship.", icon: "🚢" },
  { text: "The goal isn't more money. The goal is living life on your terms.", icon: "🌟" },
  { text: "Financial peace isn't the acquisition of stuff. It's learning to live on less.", icon: "☮️" },
  { text: "Investing in yourself is the best investment you will ever make.", icon: "🧠" },
  { text: "Today's sacrifice is tomorrow's success. Keep saving!", icon: "💎" },
  { text: "You are one decision away from a totally different financial life.", icon: "🔑" },
];

/** Get a motivational message — changes daily. */
export function getDailyMotivation() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return MESSAGES[dayOfYear % MESSAGES.length];
}

/** Get a random motivation. */
export function getRandomMotivation() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}
