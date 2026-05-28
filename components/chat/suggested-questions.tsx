"use client";

import { useEffect, useState } from "react";

type CampusSuggestionProfile = {
  breakfast: string;
  library: string;
  tonight: string;
  openNow: string;
  specific: string[];
};

const profiles: Record<string, CampusSuggestionProfile> = {
  "clarku.edu": {
    breakfast: "What's open for breakfast right now?",
    library: "Where should I study at Goddard tonight?",
    tonight: "What can I do on campus tonight?",
    openNow: "What's still open around Clark right now?",
    specific: ["Where is The Grind?", "Is Kneller free for students?", "Where is Room 402?"]
  },
  "northeastern.edu": {
    breakfast: "Where can I get breakfast near campus?",
    library: "What should I know about Snell or the Law Library?",
    tonight: "What can I do around Northeastern tonight?",
    openNow: "What's still open near Northeastern right now?",
    specific: ["How does co-op work?", "Is the MFA free?", "Where is Chicken Lou's?"]
  },
  "wpi.edu": {
    breakfast: "Where can I get breakfast near WPI?",
    library: "Where should I study at WPI tonight?",
    tonight: "What can I do around WPI tonight?",
    openNow: "What's still open near WPI right now?",
    specific: ["What is the 7-week term system?", "What is the MQP?", "Where is the Pumpkin Lounge?"]
  },
  "bu.edu": {
    breakfast: "Where can I get breakfast near BU?",
    library: "Where should I study at BU tonight?",
    tonight: "What can I do around BU tonight?",
    openNow: "What's still open near BU right now?",
    specific: ["What is Bay State Underground?", "How do I get 50% off Domino's?", "What is the BU vs BC rivalry?"]
  }
};

function getProfile(domain?: string | null) {
  return profiles[domain?.toLowerCase() ?? ""] ?? profiles["clarku.edu"];
}

function getTimeAwareQuestion(date: Date, profile: CampusSuggestionProfile) {
  const hour = date.getHours();

  if (hour < 12) {
    return profile.breakfast;
  }

  if (hour < 17) {
    return profile.library;
  }

  if (hour < 22) {
    return profile.tonight;
  }

  return profile.openNow;
}

function buildSuggestedQuestions(date: Date, domain?: string | null) {
  const profile = getProfile(domain);

  return [
    getTimeAwareQuestion(date, profile),
    ...profile.specific,
    "Suggest something for between my classes"
  ];
}

export function SuggestedQuestions({
  universityDomain,
  onSelect
}: {
  universityDomain?: string | null;
  onSelect: (value: string) => void;
}) {
  const [questions, setQuestions] = useState(() => buildSuggestedQuestions(new Date(), universityDomain));

  useEffect(() => {
    const updateQuestions = () => setQuestions(buildSuggestedQuestions(new Date(), universityDomain));

    updateQuestions();
    const interval = window.setInterval(updateQuestions, 60_000);

    return () => window.clearInterval(interval);
  }, [universityDomain]);

  return (
    <div className="cortex-panel p-6">
      <div className="eyebrow">Suggested Questions</div>
      <div className="mt-4 space-y-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className="block w-full rounded-[18px] border border-black/6 bg-white/52 px-4 py-3 text-left text-sm text-black/66 transition hover:border-cortex-gold/30 hover:bg-white/82 hover:text-cortex-ink dark:border-white/8 dark:bg-white/[0.04] dark:text-white/68 dark:hover:border-cortex-gold/20 dark:hover:bg-white/[0.06]"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
