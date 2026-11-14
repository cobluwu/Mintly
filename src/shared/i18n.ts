import type { LanguageCode, RunwayPace, SpendingCategory } from './types';

export interface TranslationBundle {
  nav: {
    home: string;
    activity: string;
    plans: string;
    circles: string;
    coach: string;
  };
  greeting: {
    morning: string;
    afternoon: string;
    evening: string;
    subtitleAhead: string;
    subtitleOnTrack: string;
    subtitleCaution: string;
    subtitleOver: string;
  };
  home: {
    totalBalance: string;
    liquidCash: string;
    runwayTitle: string;
    daysLeft: string;
    dailySafe: string;
    upcomingBills: string;
    spentCycle: string;
    weeklyPulse: string;
    quickActions: string;
    addExpense: string;
    addIncome: string;
    splitBill: string;
    addVault: string;
    paceLabels: Record<RunwayPace, string>;
  };
  activity: {
    title: string;
    searchPlaceholder: string;
    all: string;
    expenses: string;
    income: string;
    importCsv: string;
    empty: string;
  };
  plans: {
    title: string;
    monthlyPlans: string;
    vaults: string;
    contribute: string;
    ofTarget: string;
    weeksLeft: string;
    completed: string;
  };
  circles: {
    title: string;
    addSplit: string;
    whoOwesWhom: string;
    allSettled: string;
    settleUp: string;
    owes: string;
  };
  coach: {
    title: string;
    subtitle: string;
    confirmedLabel: string;
    estimateLabel: string;
    askPlaceholder: string;
    send: string;
    suggestions: string[];
  };
  categories: Record<SpendingCategory, string>;
  settings: {
    profileTitle: string;
    language: string;
    currency: string;
    allowanceCycle: string;
    cloudSync: string;
    signInGoogle: string;
    signOut: string;
    resetDemo: string;
  };
  extras: {
    moneyReport: string;
    mintCoins: string;
    campusNudges: string;
    setupWizard: string;
  };
}

const ENGLISH_BUNDLE: TranslationBundle = {
  nav: { home: 'Home', activity: 'Activity', plans: 'Plans', circles: 'Circles', coach: 'Coach' },
  greeting: {
    morning: 'Morning',
    afternoon: 'Hey',
    evening: 'Evening',
    subtitleAhead: 'Your monthly buffer looks comfortably ahead.',
    subtitleOnTrack: 'Steady pace — right on your semester rhythm.',
    subtitleCaution: 'Heads up, daily safe-to-spend is tightening.',
    subtitleOver: 'Fixed hostel & mobile bills take priority right now.',
  },
  home: {
    totalBalance: 'Available Across Accounts',
    liquidCash: 'Liquid Spendable',
    runwayTitle: 'Allowance Runway',
    daysLeft: 'days left',
    dailySafe: 'Daily Safe-to-Spend',
    upcomingBills: 'Reserved for bills',
    spentCycle: 'Spent this cycle',
    weeklyPulse: '7-Day Spending Pulse',
    quickActions: 'Quick Actions',
    addExpense: 'Expense',
    addIncome: 'Income',
    splitBill: 'Split',
    addVault: 'Save',
    paceLabels: {
      ahead: 'Ahead of Pace',
      on_track: 'On Track',
      caution: 'Watch Pace',
      over: 'Tight Buffer',
    },
  },
  activity: {
    title: 'Activity Journal',
    searchPlaceholder: 'Search merchants, UPI refs or notes...',
    all: 'All',
    expenses: 'Expenses',
    income: 'Income',
    importCsv: 'Import',
    empty: 'No matching entries yet.',
  },
  plans: {
    title: 'Plans & Vaults',
    monthlyPlans: 'Spending Plans',
    vaults: 'Savings Vaults',
    contribute: 'Boost Vault',
    ofTarget: 'of',
    weeksLeft: 'wks est.',
    completed: 'Goal Reached',
  },
  circles: {
    title: 'Circles',
    addSplit: 'Add Split',
    whoOwesWhom: 'Simplified Settlements',
    allSettled: 'Everyone is squared up!',
    settleUp: 'Settle',
    owes: 'owes',
  },
  coach: {
    title: 'Mochi Coach',
    subtitle: 'Grounded in your live ledger and runway math',
    confirmedLabel: 'Confirmed Ledger',
    estimateLabel: 'Forecast Estimate',
    askPlaceholder: 'Ask Mochi about your budget or runway...',
    send: 'Ask',
    suggestions: [
      'Can I afford a ₹800 fest pass this weekend?',
      'Where can I trim ₹500 without feeling deprived?',
      'When will my Laptop Fund reach ₹1,14,900?',
      'Can I order Swiggy tonight?',
    ],
  },
  categories: {
    dining: 'Food & Chai',
    groceries: 'Snacks & Groceries',
    transport: 'Commute',
    textbooks: 'Books & Stationery',
    subscriptions: 'Recharge & Subs',
    fun: 'Fests & Outings',
    rent: 'Hostel & Mess',
    health: 'Health & Gym',
    laundry: 'Laundry & Hostel',
    festivals: 'Gifts & Festivals',
    trips: 'Trips',
    income: 'Income',
    savings: 'Vault Transfer',
  },
  settings: {
    profileTitle: 'Student Workspace',
    language: 'Language',
    currency: 'Currency',
    allowanceCycle: 'Monthly Pocket Money',
    cloudSync: 'Cloud Sync',
    signInGoogle: 'Sign in with Google',
    signOut: 'Sign Out',
    resetDemo: 'Reset demo data',
  },
  extras: {
    moneyReport: 'Monthly Report',
    mintCoins: 'Mint Coins',
    campusNudges: 'Campus Calendar',
    setupWizard: 'Personalize Setup (3 steps)',
  },
};

const HINGLISH_BUNDLE: TranslationBundle = {
  nav: { home: 'Home', activity: 'Activity', plans: 'Plans', circles: 'Circles', coach: 'Coach' },
  greeting: {
    morning: 'Subah bakhair',
    afternoon: 'Hey',
    evening: 'Good evening',
    subtitleAhead: 'Is mahine ka budget kaafi comfortable chal raha hai.',
    subtitleOnTrack: 'Is mahine ka budget on track hai.',
    subtitleCaution: 'Thoda dhyan rakhna, daily safe-to-spend tight ho raha hai.',
    subtitleOver: 'Hostel mess aur bills pehle — extras thoda pause karte hain.',
  },
  home: {
    totalBalance: 'Available Across Accounts',
    liquidCash: 'Kharch karne layak',
    runwayTitle: 'Allowance Runway',
    daysLeft: 'din baaki',
    dailySafe: 'Aaj ka safe-to-spend',
    upcomingBills: 'Bills ke liye reserved',
    spentCycle: 'Is cycle mein kharch',
    weeklyPulse: 'Hafte ka kharch',
    quickActions: 'Quick Actions',
    addExpense: 'Kharch',
    addIncome: 'Income',
    splitBill: 'Split',
    addVault: 'Save',
    paceLabels: {
      ahead: 'Ahead of Pace',
      on_track: 'On Track',
      caution: 'Thoda Tight',
      over: 'Bills Priority',
    },
  },
  activity: {
    title: 'Activity Journal',
    searchPlaceholder: 'Merchant, UPI ref ya note search karo...',
    all: 'Sab',
    expenses: 'Kharch',
    income: 'Income',
    importCsv: 'Import',
    empty: 'Abhi koi matching entry nahi mili.',
  },
  plans: {
    title: 'Plans & Vaults',
    monthlyPlans: 'Monthly Budgets',
    vaults: 'Goal Vaults',
    contribute: 'Vault Boost',
    ofTarget: 'out of',
    weeksLeft: 'wks est.',
    completed: 'Goal Poora Hua!',
  },
  circles: {
    title: 'Circles',
    addSplit: 'Split Add Karo',
    whoOwesWhom: 'Kaun Kisko Dega',
    allSettled: 'Sabka hisaab barabar hai!',
    settleUp: 'Settle',
    owes: 'ko dena hai',
  },
  coach: {
    title: 'Mochi Coach',
    subtitle: 'Aapke real ledger aur runway math pe based',
    confirmedLabel: 'Confirmed Ledger',
    estimateLabel: 'Forecast Estimate',
    askPlaceholder: 'Mochi se budget ya Swiggy ke baare mein poocho...',
    send: 'Poocho',
    suggestions: [
      'Kya main iss weekend ₹800 ka fest pass le sakti hoon?',
      'Bina compromise kiye ₹500 kahan bacha sakte hain?',
      'Mera Laptop Fund ₹1,14,900 kab tak poora hoga?',
      'Kya aaj raat Swiggy order kar sakte hain?',
    ],
  },
  categories: {
    dining: 'Food & Chai',
    groceries: 'Snacks & Kirana',
    transport: 'Commute & Auto',
    textbooks: 'Books & Xerox',
    subscriptions: 'Recharge & Subs',
    fun: 'Fests & Outings',
    rent: 'Hostel & Mess',
    health: 'Health & Gym',
    laundry: 'Laundry & Hostel',
    festivals: 'Gifts & Festivals',
    trips: 'Trips',
    income: 'Income',
    savings: 'Vault Transfer',
  },
  settings: {
    profileTitle: 'Student Workspace',
    language: 'Language',
    currency: 'Currency',
    allowanceCycle: 'Pocket Money Cycle',
    cloudSync: 'Cloud Sync',
    signInGoogle: 'Sign in with Google',
    signOut: 'Sign Out',
    resetDemo: 'Reset demo data',
  },
  extras: {
    moneyReport: 'Monthly Hisaab',
    mintCoins: 'Mint Coins',
    campusNudges: 'Campus Calendar',
    setupWizard: 'Setup Customize Karo',
  },
};

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: ENGLISH_BUNDLE,
  hinglish: HINGLISH_BUNDLE,
};
