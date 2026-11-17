import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Send, ShieldCheck, Sparkles } from 'lucide-react';
import type { AllowanceRunwaySummary, CoachMessage, MintlyWorkspaceState } from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import { computeTotalBalanceCents, fmtINR } from '../shared/finance';
import { MochiMascot } from './brand/MochiMascot';

interface CoachViewProps {
  workspace: MintlyWorkspaceState;
  runway: AllowanceRunwaySummary;
  t: TranslationBundle;
  onSuggestedAction?: (vaultId: string, amountCents: number, label: string) => void;
}

function buildWelcomeContent(
  firstName: string,
  language: 'en' | 'hinglish',
  accountCount: number,
  totalBalanceFormatted: string,
  daysRemaining: number
): string {
  if (language === 'hinglish') {
    return `Hey ${firstName}! Main aapke ${accountCount} accounts (${totalBalanceFormatted}) aur ${daysRemaining} din ke runway ko live padh rahi hoon. Fest pass ya Swiggy order se pehle mujhse poochho!`;
  }
  return `Hey ${firstName}! I'm reading directly from your ${accountCount} accounts (${totalBalanceFormatted} across accounts) and ${daysRemaining}d runway. Ask me before any fest pass or Swiggy order.`;
}

export const CoachView: React.FC<CoachViewProps> = ({
  workspace,
  runway,
  t,
  onSuggestedAction,
}) => {
  const totalBalancePaise = useMemo(
    () => computeTotalBalanceCents(workspace.accounts),
    [workspace.accounts]
  );

  const firstName = workspace.profile.displayName.split(' ')[0];
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: buildWelcomeContent(
        firstName,
        workspace.profile.language,
        workspace.accounts.length,
        fmtINR(totalBalancePaise),
        runway.daysRemaining
      ),
      createdAtUtc: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    const nextWelcome = buildWelcomeContent(
      firstName,
      workspace.profile.language,
      workspace.accounts.length,
      fmtINR(totalBalancePaise),
      runway.daysRemaining
    );
    setMessages((prev) =>
      prev.map((m) => (m.id === 'welcome' ? { ...m, content: nextWelcome } : m))
    );
  }, [
    firstName,
    workspace.profile.language,
    workspace.accounts.length,
    totalBalancePaise,
    runway.daysRemaining,
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    setErrorMsg(null);
    const userMsg: CoachMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAtUtc: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/v1/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question: trimmed,
          workspace,
          history: nextHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Coach request failed');
      }

      const botMsg: CoachMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        confirmedFacts: data.confirmedFacts,
        forecastNote: data.forecastNote,
        suggestedAction: data.suggestedAction,
        createdAtUtc: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMsg('Mochi took too long to respond. Please tap again.');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Unable to reach Mochi Coach');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-2">
      <div className="rounded-3xl bg-[#13161C] border border-white/[0.08] p-5 flex flex-col justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-[62px] h-[62px] rounded-2xl bg-[#11141B] border border-[#A9D6B8]/30 flex items-center justify-center shrink-0">
            <MochiMascot
              mood={loading ? 'thinking' : 'happy'}
              accessory={workspace.rewards?.equippedAccessoryId}
              size={54}
            />
          </div>
          <p className="text-sm text-[#C7D0DC] leading-snug">
            {t.coach.title} — {t.coach.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/[0.08]">
          <div>
            <p className="text-[11px] font-semibold text-[#34D399] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.coach.confirmedLabel}</span>
            </p>
            <p className="font-mono text-sm font-bold text-white tabular-nums mt-0.5">
              {fmtINR(runway.liquidBalanceCents)} liquid
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#A78BFA] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.coach.estimateLabel}</span>
            </p>
            <p className="font-mono text-sm font-bold text-white tabular-nums mt-0.5">
              {fmtINR(runway.dailySafeSpendCents)}/day ({runway.daysRemaining}d)
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2">
        {t.coach.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => sendQuestion(suggestion)}
            disabled={loading}
            className="min-h-[40px] px-3.5 py-2 rounded-2xl bg-[#191D25] hover:bg-[#222733] border border-white/[0.08] text-xs font-medium text-[#E2E8F0] text-left transition-colors cursor-pointer disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div
        aria-live="polite"
        className="rounded-3xl bg-[#13161C] border border-white/[0.08] p-4 sm:p-5 space-y-4 min-h-[300px]"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#B9FF4B] text-[#0B0D10] font-medium'
                  : 'bg-[#191D25] text-[#F1F5F9] border border-white/[0.07]'
              }`}
            >
              <p>{msg.content}</p>

              {msg.confirmedFacts && msg.confirmedFacts.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.08] space-y-1">
                  <p className="text-[11px] font-semibold text-[#34D399] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.coach.confirmedLabel}</span>
                  </p>
                  <ul className="space-y-1 text-xs text-[#CBD5E1] font-mono">
                    {msg.confirmedFacts.map((fact, idx) => (
                      <li key={idx}>• {fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.forecastNote && (
                <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-xs text-[#A78BFA] flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold">{t.coach.estimateLabel}:</strong>{' '}
                    {msg.forecastNote}
                  </span>
                </div>
              )}

              {msg.suggestedAction && onSuggestedAction && msg.suggestedAction.vaultId && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      onSuggestedAction(
                        msg.suggestedAction!.vaultId!,
                        msg.suggestedAction!.amountCents || 20000,
                        msg.suggestedAction!.label
                      )
                    }
                    className="min-h-[34px] px-3.5 rounded-full bg-[#B9FF4B] hover:bg-[#c8ff70] text-[#0B0D10] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{msg.suggestedAction.label}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-xs text-[#94A3B8] animate-pulse px-2">
            Mochi is checking your ledger...
          </div>
        )}

        {errorMsg && (
          <div className="text-xs text-[#FF6B6B] px-2" role="alert">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestion(input);
        }}
        className="flex items-center gap-2"
      >
        <label className="flex-1 block">
          <span className="sr-only">{t.coach.askPlaceholder}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.coach.askPlaceholder}
            className="w-full min-h-[48px] px-4 rounded-2xl bg-[#13161C] border border-white/[0.09] text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#B9FF4B]"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="min-h-[48px] px-5 rounded-2xl bg-[#B9FF4B] hover:bg-[#c8ff70] disabled:opacity-40 text-[#0B0D10] text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>{t.coach.send}</span>
        </button>
      </form>

      <p className="text-[11px] text-center text-[#94A3B8]/80 pt-1">
        Mochi gives budgeting guidance, not financial advice.
      </p>
    </div>
  );
};
