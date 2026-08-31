/**
 * Device tracking — stores device info on login for security awareness.
 * Also handles "Remember Me" via Supabase session persistence.
 */

import { supabase, isSupabaseConfigured } from "./supabase";

/** Get current device information */
export function getDeviceInfo() {
  if (typeof window === "undefined") return {};

  const ua = navigator.userAgent;

  // Detect browser
  let browser = "Unknown";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  // Detect OS
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  // Build a friendly device name
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const deviceType = isMobile ? "Mobile" : "Desktop";
  const deviceName = `${browser} on ${os} (${deviceType})`;

  return {
    device_name: deviceName,
    browser,
    os,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    user_agent: ua.substring(0, 500), // cap length
  };
}

/**
 * Record device login in Supabase.
 * Updates existing device record if same browser+OS combo exists.
 */
export async function trackDevice(userId) {
  if (!isSupabaseConfigured() || !userId) return;

  const info = getDeviceInfo();

  try {
    // Check if this device already exists for user
    const { data: existing } = await supabase
      .from("user_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("browser", info.browser)
      .eq("os", info.os)
      .eq("screen_width", info.screen_width)
      .maybeSingle();

    if (existing) {
      // Update last login time
      await supabase
        .from("user_devices")
        .update({ last_login: new Date().toISOString(), user_agent: info.user_agent })
        .eq("id", existing.id);
    } else {
      // Insert new device
      await supabase
        .from("user_devices")
        .insert({ user_id: userId, ...info });
    }
  } catch (err) {
    console.log("Device tracking error:", err.message);
  }
}

/**
 * Get all devices for a user.
 */
export async function getUserDevices(userId) {
  if (!isSupabaseConfigured() || !userId) return [];

  const { data } = await supabase
    .from("user_devices")
    .select("*")
    .eq("user_id", userId)
    .order("last_login", { ascending: false });

  return data || [];
}

/**
 * Remove a device.
 */
export async function removeDevice(deviceId) {
  if (!isSupabaseConfigured()) return;
  await supabase.from("user_devices").delete().eq("id", deviceId);
}

/**
 * "Remember Me" — Supabase handles session persistence automatically.
 * By default, sessions persist in localStorage until expiry.
 * When "Remember Me" is OFF, we store a flag to clear session on browser close.
 */
export function setRememberMe(remember) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cashguard_remember_me", remember ? "true" : "false");
}

export function getRememberMe() {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem("cashguard_remember_me");
  return val !== "false"; // default to true (remember)
}

/**
 * Clear session if "Remember Me" was off (called on page load).
 * Uses sessionStorage to detect if this is a new browser session.
 */
export function checkSessionPersistence() {
  if (typeof window === "undefined") return;

  const remember = getRememberMe();
  if (remember) return; // user wants to stay logged in

  // If "Remember Me" is off, check if this is a fresh browser session
  const sessionAlive = sessionStorage.getItem("cashguard_session_alive");
  if (!sessionAlive) {
    // New browser session — clear the Supabase auth token
    // This effectively logs the user out when they close and reopen the browser
    supabase.auth.signOut();
  }
  sessionStorage.setItem("cashguard_session_alive", "1");
}
