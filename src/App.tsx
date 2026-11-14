import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import type {
  CircleDebtTransfer,
  ContextualNudge,
  CurrencyCode,
  IncomeSource,
  LanguageCode,
  PaymentMode,
  SpendingCategory,
  SplitMode,
} from './shared/types';
import {
  MOCHI_ACCESSORIES,
  computeVaultMetrics,
  fmtINR,
} from './shared/finance';
import { TRANSLATIONS } from './shared/i18n';
import { SPRING_BOUNCY } from './shared/motion';
import { MintlyStoreProvider, useMintlyStore } from './lib/store';
import { loadLocalWorkspace, saveLocalWorkspace } from './lib/storage';
import {
  auth,
  loadOrSeedFirestoreWorkspace,
  persistFullWorkspaceToFirestore,
  signInWithGoogle,
  signOutFirebase,
} from './lib/firebase';
import { HomeView } from './components/HomeView';
import { ActivityView } from './components/ActivityView';
import { PlansView } from './components/PlansView';
import { CirclesView } from './components/CirclesView';
import { CoachView } from './components/CoachView';
import { ActionSheets, type ActiveSheet } from './components/ActionSheets';
import type { CardControlState } from './components/CardCarousel';
import {
  SuccessCelebration,
  type SuccessCelebrationData,
} from './components/SuccessCelebration';
import { BrandStudioPage } from './components/brand/BrandStudioPage';
import { StyleGuidePage } from './components/StyleGuidePage';
import { FloatingBottomNav, type NavTabKey } from './components/ui/FloatingBottomNav';
import { OnboardingModal } from './components/OnboardingModal';

function MintlyApp() {
  const {
    state: workspace,
    dispatch,
    runway,
    budgets,
    monthlyReport,
    nudges,
    resetDemoData,
  } = useMintlyStore();

  const [activeTab, setActiveTab] = useState<NavTabKey>('home');
  const [sheet, setSheet] = useState<ActiveSheet>({ kind: 'none' });
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
      return false;
    }
    return !workspace.profile.onboardingCompleted;
  });
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<SuccessCelebrationData | null>(null);
  const [recentMilestoneTitle, setRecentMilestoneTitle] = useState<string | null>(null);
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  const cardControls = useMemo<Record<string, CardControlState>>(() => {
    const map: Record<string, CardControlState> = {};
    for (const acc of workspace.accounts) {
      map[acc.id] = {
        frozen: Boolean(acc.frozen),
        dailyLimitCents: acc.dailyLimitCents ?? 250000,
      };
    }
    return map;
  }, [workspace.accounts]);

  const navigateRoute = (nextPath: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', nextPath);
    }
    setPathname(nextPath);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  };

  const handleToggleCardFreeze = (accountId: string) => {
    const curr = workspace.accounts.find((a) => a.id === accountId);
    const nextFrozen = !curr?.frozen;
    dispatch({ type: 'TOGGLE_ACCOUNT_FREEZE', accountId });
    showToast(nextFrozen ? 'Account frozen safely' : 'Account unfrozen & ready');
  };

  const handleChangeCardLimit = (accountId: string, nextLimitCents: number) => {
    dispatch({ type: 'SET_ACCOUNT_LIMIT', accountId, dailyLimitCents: nextLimitCents });
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUid(null);
        setAuthEmail(null);
        return;
      }
      setAuthUid(user.uid);
      setAuthEmail(user.email || user.displayName || 'Connected');
      setCloudBusy(true);
      try {
        const synced = await loadOrSeedFirestoreWorkspace(user.uid, loadLocalWorkspace());
        dispatch({ type: 'HYDRATE', payload: synced });
        saveLocalWorkspace(synced);
      } catch (err) {
        console.error('Firestore workspace load failed:', err);
      } finally {
        setCloudBusy(false);
      }
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    if (!authUid) return;
    void persistFullWorkspaceToFirestore(authUid, workspace).catch((err) => {
      console.error('Background Firestore sync failed:', err);
    });
  }, [authUid, workspace]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const t = TRANSLATIONS[workspace.profile.language] || TRANSLATIONS.en;

  const handleAddTransaction = (payload: {
    type: 'expense' | 'income';
    merchant: string;
    amountCents: number;
    category: SpendingCategory;
    accountId: string;
    note: string;
    paymentMode?: PaymentMode;
    paidToUpiId?: string;
    incomeSource?: IncomeSource;
  }) => {
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        txType: payload.type,
        accountId: payload.accountId,
        amountCents: payload.amountCents,
        category: payload.category,
        merchant: payload.merchant,
        note: payload.note,
        paymentMode: payload.paymentMode,
        paidToUpiId: payload.paidToUpiId,
        incomeSource: payload.incomeSource,
      },
    });

    const formattedAmt = fmtINR(payload.amountCents);
    setCelebration({
      id: `cel_${Date.now()}`,
      headline:
        payload.type === 'income'
          ? `Added ${formattedAmt}`
          : `Logged ${formattedAmt}`,
      subline:
        payload.type === 'income'
          ? `${payload.merchant} added to your balance`
          : `${payload.merchant} · Runway updated`,
      accentColor: '#0B3B3A',
    });
  };

  const handleReverseTransaction = (txId: string) => {
    dispatch({ type: 'REVERSE_TRANSACTION', txId });
    showToast('Reversed back to your account');
  };

  const handleChangeCategory = (txId: string, category: SpendingCategory) => {
    dispatch({ type: 'UPDATE_TRANSACTION_CATEGORY', txId, category });
    showToast(`Category updated to ${t.categories[category]}`);
  };

  const handleContributeVault = (vaultId: string, amountCents: number, note: string) => {
    const targetVault = workspace.vaults.find((v) => v.id === vaultId);
    const beforeLevel = targetVault ? computeVaultMetrics(targetVault).milestoneLevel : 0;
    const afterLevel = targetVault
      ? computeVaultMetrics({ ...targetVault, savedCents: targetVault.savedCents + amountCents })
          .milestoneLevel
      : 0;
    const unlockedMilestoneTitle =
      targetVault && afterLevel > beforeLevel ? targetVault.title : null;

    const sourceAccountId =
      workspace.accounts.find((a) => a.type === 'bank' || a.type === 'checking')?.id ||
      workspace.accounts[0]?.id ||
      'acc_bank';

    dispatch({
      type: 'CONTRIBUTE_VAULT',
      vaultId,
      accountId: sourceAccountId,
      amountCents,
      note,
    });

    const formattedSaved = fmtINR(amountCents);
    if (unlockedMilestoneTitle) {
      setRecentMilestoneTitle(unlockedMilestoneTitle);
      setTimeout(() => {
        setRecentMilestoneTitle((curr) => (curr === unlockedMilestoneTitle ? null : curr));
      }, 15000);
    }

    setCelebration({
      id: `cel_${Date.now()}`,
      headline: `Saved ${formattedSaved}`,
      subline: unlockedMilestoneTitle
        ? `Milestone unlocked on ${unlockedMilestoneTitle}`
        : 'Tucked straight into your vault',
      accentColor: '#0B3B3A',
    });
  };

  const handleToggleRoundUps = (enabled: boolean, targetVaultId?: string) => {
    dispatch({ type: 'TOGGLE_ROUND_UPS', enabled, targetVaultId });
    const vaultTitle = workspace.vaults.find((v) => v.id === targetVaultId)?.title;
    showToast(
      enabled
        ? `₹10 round-ups ON${vaultTitle ? ` -> ${vaultTitle}` : ''}`
        : '₹10 round-ups paused'
    );
  };

  const handleAddCircleSplit = (payload: {
    circleId: string;
    title: string;
    amountCents: number;
    paidByMemberId: string;
    splitBetweenIds: string[];
    splitMode: SplitMode;
    customSplits?: Record<string, number>;
  }) => {
    dispatch({
      type: 'ADD_CIRCLE_EXPENSE',
      circleId: payload.circleId,
      title: payload.title,
      amountCents: payload.amountCents,
      paidByMemberId: payload.paidByMemberId,
      splitBetweenIds: payload.splitBetweenIds,
      splitMode: payload.splitMode,
      customSplits: payload.customSplits,
    });
    showToast(`Split "${payload.title}" added (${payload.splitMode})`);
  };

  const handleConfirmCircleSettle = (payload: {
    circleId: string;
    fromMemberId: string;
    toMemberId: string;
    amountCents: number;
    upiApp: string;
    accountId?: string;
  }) => {
    const upiRef = String(Math.floor(431900000000 + Math.random() * 99999999));
    dispatch({
      type: 'SETTLE_CIRCLE_TRANSFER',
      circleId: payload.circleId,
      fromMemberId: payload.fromMemberId,
      toMemberId: payload.toMemberId,
      amountCents: payload.amountCents,
      upiRef,
      upiApp: payload.upiApp,
      accountId: payload.accountId,
    });

    const circle = workspace.circles.find((c) => c.id === payload.circleId);
    const toName =
      circle?.members.find((m) => m.id === payload.toMemberId)?.name || 'Member';
    setCelebration({
      id: `cel_${Date.now()}`,
      headline: `Settled ${fmtINR(payload.amountCents)}`,
      subline: `${toName} via ${payload.upiApp} · UPI Ref ${upiRef}`,
      accentColor: '#0B3B3A',
    });
  };

  const handleImportBatch = async (
    rawText: string
  ): Promise<{ addedCount: number; duplicateCount: number; parserUsed?: string }> => {
    const response = await fetch('/api/v1/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: workspace.profile.uid,
        accountId: workspace.accounts[0]?.id || 'acc_bank',
        existing: workspace.transactions,
        rawText,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Import failed');
    }

    dispatch({ type: 'IMPORT_TRANSACTIONS', transactions: data.merged });
    return {
      addedCount: data.addedCount,
      duplicateCount: data.duplicateCount,
      parserUsed: data.parserUsed,
    };
  };

  const handleUpdateSettings = (patch: {
    language?: LanguageCode;
    currency?: CurrencyCode;
    allowanceAmountCents?: number;
    nextAllowanceIso?: string;
  }) => {
    dispatch({
      type: 'UPDATE_PROFILE',
      patch: {
        ...patch,
        currency: 'INR',
      },
    });
  };

  const handleUnlockReward = (itemId: string, costCoins: number, equip = true) => {
    const spec = MOCHI_ACCESSORIES.find((a) => a.id === itemId);
    const alreadyUnlocked = workspace.rewards?.unlockedItemIds.includes(itemId);
    dispatch({ type: 'UNLOCK_REWARD', itemId, costCoins, equip });
    if (alreadyUnlocked) {
      showToast(`Equipped ${spec?.label || 'cosmetic'} on Mochi!`);
    } else {
      showToast(`Unlocked & equipped ${spec?.label || 'cosmetic'}!`);
    }
  };

  const handleNudgeAction = (nudge: ContextualNudge) => {
    if (nudge.kind === 'month_end') {
      setActiveTab('plans');
    } else if (nudge.kind === 'fee') {
      setSheet({ kind: 'report' });
    } else if (nudge.kind === 'exam') {
      const target =
        workspace.vaults.find((v) => v.goalTheme === 'placement') ?? workspace.vaults[0];
      if (target) setSheet({ kind: 'vault', vaultId: target.id });
    } else if (nudge.kind === 'diwali') {
      const target =
        workspace.vaults.find((v) => v.goalTheme === 'festivals') ?? workspace.vaults[0];
      if (target) setSheet({ kind: 'vault', vaultId: target.id });
    }
  };

  const handleGoogleSignIn = async () => {
    setCloudBusy(true);
    try {
      await signInWithGoogle();
      showToast('Synced with Google Cloud');
    } catch (err) {
      console.error('Sign in failed:', err);
      showToast('Sign in cancelled');
    } finally {
      setCloudBusy(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setCloudBusy(true);
    try {
      await signOutFirebase();
      showToast('Signed out');
    } finally {
      setCloudBusy(false);
    }
  };

  if (pathname === '/brand') {
    return (
      <MotionConfig reducedMotion="user">
        <BrandStudioPage onBackToApp={() => navigateRoute('/')} />
      </MotionConfig>
    );
  }

  if (pathname === '/style-guide') {
    return (
      <MotionConfig reducedMotion="user">
        <StyleGuidePage onBackToApp={() => navigateRoute('/')} />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen relative overflow-x-clip text-[#0E2B2B] flex flex-col">
        {/* Full-screen slowly drifting soft mesh gradient + grain overlay */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-20 mintly-atmosphere-bg mintly-atmosphere-drift pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 mintly-grain-overlay pointer-events-none"
        />

        {/* Centered Phone-Width Column (390px-430px) */}
        <main className="flex-1 w-full max-w-[430px] mx-auto px-5 pt-4 pb-28">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="tab-home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <HomeView
                  workspace={workspace}
                  runway={runway}
                  budgets={budgets}
                  monthlyReport={monthlyReport}
                  nudges={nudges}
                  cardControls={cardControls}
                  recentMilestoneTitle={recentMilestoneTitle}
                  t={t}
                  onQuickAction={(action) => {
                    if (action === 'expense') setSheet({ kind: 'transaction', defaultType: 'expense' });
                    else if (action === 'income') setSheet({ kind: 'transaction', defaultType: 'income' });
                    else if (action === 'split')
                      setSheet({ kind: 'split', circleId: workspace.circles[0]?.id || '' });
                    else if (action === 'vault')
                      setSheet({ kind: 'vault', vaultId: workspace.vaults[0]?.id || '' });
                  }}
                  onOpenSettings={() => setSheet({ kind: 'settings' })}
                  onOpenReport={() => setSheet({ kind: 'report' })}
                  onOpenRewards={() => setSheet({ kind: 'rewards' })}
                  onHandleNudge={handleNudgeAction}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onToggleCardFreeze={handleToggleCardFreeze}
                  onChangeCardLimit={handleChangeCardLimit}
                  onReverseTransaction={handleReverseTransaction}
                />
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="tab-activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-[28px] bg-[#0B3B3A] p-4 text-white shadow-[var(--shadow-teal)]"
              >
                <ActivityView
                  workspace={workspace}
                  t={t}
                  onOpenImport={() => setSheet({ kind: 'import' })}
                  onOpenReport={() => setSheet({ kind: 'report' })}
                  onReverseTransaction={handleReverseTransaction}
                  onChangeCategory={handleChangeCategory}
                  onSplitTransaction={(tx) =>
                    setSheet({
                      kind: 'split',
                      circleId: workspace.circles[0]?.id || '',
                      prefillTitle: tx.merchant,
                      prefillAmountCents: tx.amountCents,
                    })
                  }
                />
              </motion.div>
            )}

            {activeTab === 'plans' && (
              <motion.div
                key="tab-plans"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-[28px] bg-[#0B3B3A] p-4 text-white shadow-[var(--shadow-teal)]"
              >
                <PlansView
                  workspace={workspace}
                  budgets={budgets}
                  nudges={nudges}
                  t={t}
                  onContributeVault={(vaultId) => setSheet({ kind: 'vault', vaultId })}
                  onToggleRoundUps={handleToggleRoundUps}
                  onHandleNudge={handleNudgeAction}
                />
              </motion.div>
            )}

            {activeTab === 'circles' && (
              <motion.div
                key="tab-circles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-[28px] bg-[#0B3B3A] p-4 text-white shadow-[var(--shadow-teal)]"
              >
                <CirclesView
                  workspace={workspace}
                  t={t}
                  onOpenAddSplit={(circleId) => setSheet({ kind: 'split', circleId })}
                  onSettleTransfer={(circleId: string, transfer: CircleDebtTransfer) =>
                    setSheet({ kind: 'settle', circleId, transfer })
                  }
                />
              </motion.div>
            )}

            {activeTab === 'coach' && (
              <motion.div
                key="tab-coach"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-[28px] bg-[#0B3B3A] p-4 text-white shadow-[var(--shadow-teal)]"
              >
                <CoachView
                  workspace={workspace}
                  runway={runway}
                  t={t}
                  onSuggestedAction={(vaultId, amountCents) =>
                    handleContributeVault(vaultId, amountCents, 'Mochi Coach boost')
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Frosted Bottom Navigation */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-[398px] flex justify-center pointer-events-none">
          <FloatingBottomNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            labels={{
              home: t.nav.home,
              activity: t.nav.activity,
              plans: t.nav.plans,
              circles: t.nav.circles,
              coach: 'Mochi',
            }}
          />
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={SPRING_BOUNCY}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#0B3B3A] text-xs font-medium text-white shadow-[0_14px_30px_rgba(14,43,43,0.28)] whitespace-nowrap"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Celebration Overlay */}
        <SuccessCelebration
          data={celebration}
          onDismiss={() => setCelebration(null)}
        />

        {/* Action Bottom Sheets & Modals */}
        <ActionSheets
          sheet={sheet}
          workspace={workspace}
          budgets={budgets}
          monthlyReport={monthlyReport}
          cardControls={cardControls}
          t={t}
          authUserEmail={authEmail}
          cloudBusy={cloudBusy}
          onClose={() => setSheet({ kind: 'none' })}
          onAddTransaction={handleAddTransaction}
          onContributeVault={handleContributeVault}
          onAddCircleSplit={handleAddCircleSplit}
          onConfirmCircleSettle={handleConfirmCircleSettle}
          onImportBatch={handleImportBatch}
          onUpdateSettings={handleUpdateSettings}
          onUnlockReward={handleUnlockReward}
          onOpenSheet={setSheet}
          onOpenOnboarding={() => {
            setSheet({ kind: 'none' });
            setOnboardingOpen(true);
          }}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          onResetWorkspace={() => {
            resetDemoData();
            showToast('Demo data reset');
          }}
          onOpenStyleGuide={() => navigateRoute('/style-guide')}
          onOpenBrandStudio={() => navigateRoute('/brand')}
        />

        {/* 3-Screen Skippable Student Onboarding */}
        <OnboardingModal
          open={onboardingOpen}
          workspace={workspace}
          onComplete={(payload) => {
            dispatch({ type: 'APPLY_ONBOARDING', payload });
            setOnboardingOpen(false);
            showToast('Campus setup personalized!');
          }}
          onSkip={() => {
            dispatch({ type: 'SKIP_ONBOARDING' });
            setOnboardingOpen(false);
          }}
        />
      </div>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <MintlyStoreProvider>
      <MintlyApp />
    </MintlyStoreProvider>
  );
}
