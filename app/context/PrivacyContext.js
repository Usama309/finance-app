"use client";

import { createContext, useContext, useState, useEffect } from "react";

const PrivacyContext = createContext({});

export function PrivacyProvider({ children }) {
  const [hidden, setHidden] = useState(true); // Hidden by default

  useEffect(() => {
    const saved = localStorage.getItem("cashguard_privacy");
    if (saved !== null) setHidden(saved === "true");
  }, []);

  function toggle() {
    setHidden((h) => {
      localStorage.setItem("cashguard_privacy", String(!h));
      return !h;
    });
  }

  /** Mask a value — returns "••••••" when hidden, the actual value when visible */
  function mask(value) {
    if (!hidden) return value;
    return "••••••";
  }

  /** Mask a formatted PKR amount */
  function maskAmount(formatted) {
    if (!hidden) return formatted;
    return "Rs •••••";
  }

  return (
    <PrivacyContext.Provider value={{ hidden, toggle, mask, maskAmount }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
