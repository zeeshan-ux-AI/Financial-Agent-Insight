import React, { createContext, useContext, useState, useEffect } from 'react';

type Locale = 'en' | 'bn';

interface Translations {
  [key: string]: string;
}

const translations: Record<Locale, Translations> = {
  en: {
    dashboard: "Dashboard",
    transactions: "Transactions",
    alerts: "Alerts",
    audit_log: "Audit Log",
    settings: "Settings",
    physical_cash: "Total Physical Cash Pool",
    active_alerts: "Active Alerts",
    tx_volume_24h: "24h Transaction Volume",
    flagged_tx: "Flagged Transactions",
    liquidity_ratio: "Liquidity Ratio",
    simulate_anomaly: "Simulate Anomaly",
    seed_data: "Seed Data",
    search: "Search...",
    requires_review: "Requires Review",
    alert_disclaimer: "Alerts indicate situations requiring human review. No automated actions are taken.",
    system_disclaimer: "This system is for decision-support only. No financial actions are performed automatically.",
    view_details: "View Details",
    status_open: "Open",
    status_escalated: "Escalated",
    status_resolved: "Resolved",
    sev_critical: "Critical",
    sev_high: "High",
    sev_medium: "Medium",
    sev_low: "Low",
    type_liquidity: "Liquidity",
    type_anomaly: "Anomaly",
    language: "Language",
    english: "English",
    bengali: "Bengali",
    provider: "Provider",
    amount: "Amount",
    type: "Type",
    date: "Date",
    action: "Action",
    actor: "Actor",
    notes: "Notes",
    add_comment: "Add Comment",
    update_status: "Update Status",
    recommended_steps: "Recommended Steps",
    evidence: "Evidence",
    related_tx: "Related Transactions",
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    transactions: "লেনদেন",
    alerts: "সতর্কতা",
    audit_log: "অডিট লগ",
    settings: "সেটিংস",
    physical_cash: "মোট শারীরিক নগদ পুল",
    active_alerts: "সক্রিয় সতর্কতা",
    tx_volume_24h: "২৪ ঘণ্টার লেনদেন ভলিউম",
    flagged_tx: "ফ্ল্যাগ করা লেনদেন",
    liquidity_ratio: "তারল্য অনুপাত",
    simulate_anomaly: "অস্বাভাবিকতা সিমুলেট করুন",
    seed_data: "ডেটা সিড করুন",
    search: "অনুসন্ধান...",
    requires_review: "পর্যালোচনা প্রয়োজন",
    alert_disclaimer: "সতর্কতাগুলি মানব পর্যালোচনা প্রয়োজন এমন পরিস্থিতি নির্দেশ করে। কোনো স্বয়ংক্রিয় পদক্ষেপ নেওয়া হয় না।",
    system_disclaimer: "এই সিস্টেমটি শুধুমাত্র সিদ্ধান্ত-সমর্থনের জন্য। কোনো আর্থিক কাজ স্বয়ংক্রিয়ভাবে সম্পন্ন হয় না।",
    view_details: "বিস্তারিত দেখুন",
    status_open: "উন্মুক্ত",
    status_escalated: "উত্তোলিত",
    status_resolved: "সমাধানকৃত",
    sev_critical: "সংকটজনক",
    sev_high: "উচ্চ",
    sev_medium: "মাঝারি",
    sev_low: "নিম্ন",
    type_liquidity: "তারল্য",
    type_anomaly: "অস্বাভাবিকতা",
    language: "ভাষা",
    english: "ইংরেজি",
    bengali: "বাংলা",
    provider: "সরবরাহকারী",
    amount: "পরিমাণ",
    type: "প্রকার",
    date: "তারিখ",
    action: "পদক্ষেপ",
    actor: "অভিনেতা",
    notes: "নোট",
    add_comment: "মন্তব্য যোগ করুন",
    update_status: "স্ট্যাটাস আপডেট করুন",
    recommended_steps: "প্রস্তাবিত পদক্ষেপ",
    evidence: "প্রমাণ",
    related_tx: "সম্পর্কিত লেনদেন",
  }
};

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('app-locale');
    return (saved === 'bn' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-locale', locale);
  }, [locale]);

  const t = (key: string) => {
    return translations[locale][key] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
