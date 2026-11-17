import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { CoachMessage, MintlyWorkspaceState } from '../shared/types';
import { buildCoachFinancialSnapshot } from '../shared/finance';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface CoachStructuredReply {
  answer: string;
  confirmedFacts: string[];
  forecastNote: string;
  suggestedAction?: {
    label: string;
    vaultId?: string;
    amountCents?: number;
  };
}

function sanitizeInrText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\$\s?(\d)/g, '₹$1').trim();
}

export async function generateCoachReply(params: {
  question: string;
  workspace: MintlyWorkspaceState;
  history: CoachMessage[];
  nowUtcIso: string;
}): Promise<CoachStructuredReply> {
  const { question, workspace, history, nowUtcIso } = params;
  const snapshot = buildCoachFinancialSnapshot(workspace, nowUtcIso);
  const ai = getGeminiClient();

  if (!ai) {
    return buildDeterministicFallbackReply(question, snapshot);
  }

  const languageNames: Record<string, string> = {
    en: 'English (Indian student context, always use ₹ with Indian numbering)',
    hinglish:
      'Hinglish (warm, friendly Indian college English mixed naturally with Roman Hindi words like "bhai/yaar/mahine/kharch/bachat", always use ₹)',
  };
  const targetLang = languageNames[workspace.profile.language] || languageNames.en;

  const systemInstruction = `You are Mochi, the Mintly Indian college student money coach.
Respond in ${targetLang}. Keep your tone warm, encouraging, concise, and practical for an engineering student living on monthly pocket money in India.
STRICT GROUNDING RULES:
1. Only cite financial numbers that appear in the provided USER_LEDGER_SNAPSHOT JSON. Never invent balances, transactions, or dollar ($) amounts—always use ₹ (INR).
2. Separate confirmed facts (current balances, posted spending, upcoming reserved bills, round-ups, pending circle splits) from forward-looking estimates/forecasts.
3. Keep the main answer under 90 words, clear and actionable.
4. Populate confirmedFacts with 2-3 short bullet strings quoting exact ₹ numbers from the snapshot.
5. Populate forecastNote with 1 short sentence explicitly framed as an estimate/projection.`;

  const recentTurns = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Student' : 'Mochi'}: ${m.content}`)
    .join('\n');

  const prompt = `USER_LEDGER_SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

RECENT_CONVERSATION:
${recentTurns || 'None'}

STUDENT_QUESTION:
${question}`;

  const GEMINI_TIMEOUT_MS = 7500;
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING },
              confirmedFacts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              forecastNote: { type: Type.STRING },
            },
            required: ['answer', 'confirmedFacts', 'forecastNote'],
          },
        },
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Coach Gemini timeout')), GEMINI_TIMEOUT_MS);
      }),
    ]);

    const rawText = (response.text ?? '').trim();
    const parsed = JSON.parse(rawText) as Partial<CoachStructuredReply>;
    const cleanAnswer = sanitizeInrText(parsed.answer);
    if (!cleanAnswer) {
      return buildDeterministicFallbackReply(question, snapshot);
    }

    const cleanFacts = Array.isArray(parsed.confirmedFacts)
      ? parsed.confirmedFacts.map(sanitizeInrText).filter(Boolean).slice(0, 4)
      : [];

    const firstVault = snapshot.vaults[0];
    return {
      answer: cleanAnswer,
      confirmedFacts:
        cleanFacts.length > 0
          ? cleanFacts
          : [
              `Liquid balance: ${snapshot.liquidBalanceFormatted} (${snapshot.upcomingBillsFormatted} reserved for bills)`,
              `Daily safe spend: ${snapshot.dailySafeSpendFormatted} across ${snapshot.daysUntilAllowance} days`,
            ],
      forecastNote:
        sanitizeInrText(parsed.forecastNote) ||
        'Estimate: Assumes current daily campus spending pace continues through your next allowance reset.',
      suggestedAction:
        /save|vault|boost|trim|bacha|laptop|goa|poora/i.test(question) && firstVault
          ? { label: `Boost ${firstVault.title} ₹200`, vaultId: firstVault.id, amountCents: 20000 }
          : undefined,
    };
  } catch (err) {
    console.warn('Gemini coach fallback triggered:', err instanceof Error ? err.message : err);
    return buildDeterministicFallbackReply(question, snapshot);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function buildDeterministicFallbackReply(
  question: string,
  snapshot: ReturnType<typeof buildCoachFinancialSnapshot>
): CoachStructuredReply {
  const q = question.toLowerCase();
  const isHinglish = snapshot.language === 'hinglish';
  const topCat = snapshot.topCategories[0];
  const topVault = snapshot.vaults[0];
  const goaVault = snapshot.vaults.find((v) => /goa|trip/i.test(v.title)) ?? topVault;

  let answer = isHinglish
    ? `Abhi aapke paas ${snapshot.liquidBalanceFormatted} liquid balance hai aur ${snapshot.upcomingBillsFormatted} upcoming bills (Hostel Mess & recharge) ke liye reserved hain. Next ${snapshot.daysUntilAllowance} din ke liye daily safe-to-spend ${snapshot.dailySafeSpendFormatted} hai.`
    : `Right now you have ${snapshot.liquidBalanceFormatted} across accounts with ${snapshot.upcomingBillsFormatted} reserved for upcoming hostel & recharge bills, giving you ${snapshot.dailySafeSpendFormatted}/day for the next ${snapshot.daysUntilAllowance} days.`;

  let suggestedAction: CoachStructuredReply['suggestedAction'] | undefined;

  if (
    q.includes('afford') ||
    q.includes('fest') ||
    q.includes('pass') ||
    q.includes('swiggy') ||
    q.includes('buy') ||
    q.includes('800') ||
    q.includes('le sakti') ||
    q.includes('order kar')
  ) {
    answer = isHinglish
      ? `Next ${snapshot.daysUntilAllowance} din tak aapka safe daily spend ${snapshot.dailySafeSpendFormatted} hai. Ek ₹800 fest pass ya Swiggy treat tabhi smooth rahega agar agle 2 din canteen chai & mess meals pe stay karo.`
      : `With ${snapshot.daysUntilAllowance} days left until reset (${snapshot.nextAllowanceDate}), your safe daily spend is ${snapshot.dailySafeSpendFormatted}. A ₹800 fest pass or treat fits comfortably if you keep the next two campus days low-spend.`;
  } else if (
    q.includes('vault') ||
    q.includes('laptop') ||
    q.includes('goa') ||
    q.includes('round') ||
    q.includes('poora') ||
    q.includes('1,14,900')
  ) {
    if (topVault) {
      answer = isHinglish
        ? `Aapka ${topVault.title} abhi ${topVault.percent}% (${topVault.saved} of ${topVault.target}) pe hai${snapshot.roundUp.enabled ? `, aur ₹10 round-ups se ${topVault.title} mein ${snapshot.roundUp.monthlySaved} extra save ho chuke hain` : ''}.`
        : `Your ${topVault.title} is at ${topVault.percent}% (${topVault.saved} of ${topVault.target})${snapshot.roundUp.enabled ? `, boosted by ${snapshot.roundUp.monthlySaved} from ₹10 round-ups this month` : ''}.`;
      suggestedAction = {
        label: `Boost ${topVault.title} ₹200`,
        vaultId: topVault.id,
        amountCents: 20000,
      };
    }
  } else if (
    q.includes('trim') ||
    q.includes('save') ||
    q.includes('cut') ||
    q.includes('bacha') ||
    q.includes('kahan')
  ) {
    if (topCat) {
      answer = isHinglish
        ? `Is cycle mein sabse zyada kharch ${topCat.category} (${topCat.total}) mein hua hai. Hafte mein 2 late-night deliveries skip karke aap turant ₹450–₹500 bacha sakti hain.`
        : `Your top category this cycle is ${topCat.category} (${topCat.total}). Swapping two late-night Swiggy orders for hostel canteen chai frees ₹450–₹500 immediately while keeping your ${snapshot.pace.replace('_', ' ')} pace.`;
      if (goaVault) {
        suggestedAction = {
          label: `Save ₹200 -> ${goaVault.title}`,
          vaultId: goaVault.id,
          amountCents: 20000,
        };
      }
    }
  }

  return {
    answer,
    confirmedFacts: [
      `Liquid balance: ${snapshot.liquidBalanceFormatted} (${snapshot.upcomingBillsFormatted} reserved for bills)`,
      `Daily safe spend: ${snapshot.dailySafeSpendFormatted} across ${snapshot.daysUntilAllowance} days`,
      topCat
        ? `Top category: ${topCat.category} (${topCat.total}) · ₹10 round-ups: ${snapshot.roundUp.monthlySaved}`
        : `Cycle spent: ${snapshot.spentThisCycleFormatted}`,
    ],
    forecastNote: isHinglish
      ? `Estimate: ${snapshot.dailySafeSpendFormatted}/day maintain karne se ${snapshot.nextAllowanceDate} tak bina tension smooth chalega.`
      : `Estimate: Holding around ${snapshot.dailySafeSpendFormatted}/day preserves your ${snapshot.pace.replace('_', ' ')} runway through ${snapshot.nextAllowanceDate}.`,
    suggestedAction,
  };
}
