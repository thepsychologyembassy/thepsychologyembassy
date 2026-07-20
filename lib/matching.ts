// Keyword-overlap matching engine.
//
// This is intentionally simple and dependency-free (no external AI call),
// so it never blocks someone mid-booking if a third-party API is slow or
// down. It scores each counselor's Sanity `bio` against the client's
// intake answers and returns the top 3, with a hard guardrail ensuring at
// least one Clinical Psychologist is always included.
//
// If you later want sharper matching, the cleanest upgrade path is adding
// a `specialties` (tag list) field to the Sanity counselor schema and
// scoring against explicit tags instead of/alongside free-text bios.

export interface CounselorForMatch {
  _id: string;
  name: string;
  designation: string;
  bio: string;
  fees: number;
  experience?: string;
}

export interface MatchResult {
  id: string;
  score: number;
  reason: string;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be",
  "been", "being", "to", "of", "in", "on", "for", "with", "i", "my", "me",
  "it", "that", "this", "have", "has", "had", "feel", "feeling", "feelings",
  "really", "very", "just", "also", "about", "from", "at", "as", "so",
  "because", "not", "no", "do", "does", "did", "am", "im", "you", "your",
  "we", "us", "our", "they", "them", "their", "get", "getting", "into",
]);

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

const isClinical = (c: CounselorForMatch) =>
  (c.designation || "").toLowerCase().includes("clinical");

export function scoreAndRankCounselors(
  intakeText: string,
  counselors: CounselorForMatch[]
): MatchResult[] {
  const issueTokens = new Set(tokenize(intakeText));

  const scored = counselors.map((c) => {
    const bioTokens = tokenize(c.bio || "");
    const bioSet = new Set(bioTokens);
    let overlap = 0;
    issueTokens.forEach((w) => {
      if (bioSet.has(w)) overlap++;
    });
    return { id: c._id, score: overlap, counselor: c };
  });

  scored.sort((a, b) => b.score - a.score);

  let top3 = scored.slice(0, Math.min(3, scored.length));

  // Guardrail: at least one Clinical Psychologist must be in the final 3,
  // whenever one exists in the dataset at all.
  const hasClinical = top3.some((s) => isClinical(s.counselor));
  if (!hasClinical) {
    const bestClinical = scored.find((s) => isClinical(s.counselor));
    if (bestClinical && top3.length > 0) {
      // Replace the weakest slot (lowest score) rather than always the
      // last one, then re-sort so ranking still reflects match strength.
      const weakestIdx = top3.reduce(
        (worstIdx, s, i, arr) => (s.score < arr[worstIdx].score ? i : worstIdx),
        0
      );
      top3[weakestIdx] = bestClinical;
      top3 = [...top3].sort((a, b) => b.score - a.score);
    }
  }

  return top3.map((s) => ({
    id: s.id,
    score: s.score,
    reason:
      s.score > 0
        ? "Their focus areas closely align with what you shared."
        : "A strong general fit based on your intake responses.",
  }));
}