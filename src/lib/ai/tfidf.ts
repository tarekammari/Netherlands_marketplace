/**
 * src/lib/ai/tfidf.ts
 *
 * Pure TypeScript TF-IDF (Term Frequency–Inverse Document Frequency) engine.
 * No external dependencies. Used by TBAI for semantic task matching.
 *
 * Algorithm:
 *   TF(t,d)  = count(t in d) / total_terms(d)
 *   IDF(t,D) = log(|D| / (1 + |{d∈D: t∈d}|))
 *   TFIDF    = TF × IDF
 *   Similarity = cosine(vec_a, vec_b)
 */

// ── Dutch stop words to ignore (improves relevance) ──────────────────────────
const STOP_WORDS = new Set([
  "de","het","een","van","in","is","dat","op","te","en","voor","met","als",
  "aan","bij","maar","of","uit","er","over","niet","ook","zijn","worden",
  "wordt","kunnen","moet","door","naar","zo","alle","dit","die","deze",
  "the","a","an","of","in","to","and","or","for","with","at","by","from",
  "on","is","are","was","be","been","have","had","do","did","will","would",
  "can","could","should","may","might","shall","that","this","which","who",
  "what","how","when","where","we","you","they","their","your","our",
]);

// ── Tokenizer ────────────────────────────────────────────────────────────────

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s\u00C0-\u024F]/g, " ") // keep accented chars
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

// ── Term Frequency ───────────────────────────────────────────────────────────

export function termFrequency(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;
  const total = tokens.length || 1;
  return Object.fromEntries(Object.entries(freq).map(([k, v]) => [k, v / total]));
}

// ── IDF from a corpus ────────────────────────────────────────────────────────

export function computeIDF(corpus: string[][]): Record<string, number> {
  const N = corpus.length;
  const docFreq: Record<string, number> = {};
  for (const tokens of corpus) {
    const unique = new Set(tokens);
    for (const t of unique) docFreq[t] = (docFreq[t] ?? 0) + 1;
  }
  const idf: Record<string, number> = {};
  for (const [term, df] of Object.entries(docFreq)) {
    idf[term] = Math.log(N / (1 + df));
  }
  return idf;
}

// ── TF-IDF Vector ────────────────────────────────────────────────────────────

export function tfidfVector(
  tokens: string[],
  idf: Record<string, number>
): Record<string, number> {
  const tf = termFrequency(tokens);
  const vec: Record<string, number> = {};
  for (const [term, tfVal] of Object.entries(tf)) {
    if (idf[term] !== undefined) {
      vec[term] = tfVal * idf[term];
    }
  }
  return vec;
}

// ── Cosine Similarity ────────────────────────────────────────────────────────

export function cosineSimilarity(
  vecA: Record<string, number>,
  vecB: Record<string, number>
): number {
  let dot = 0, normA = 0, normB = 0;
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  for (const term of allTerms) {
    const a = vecA[term] ?? 0;
    const b = vecB[term] ?? 0;
    dot   += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Document → dense vector (for storage) ───────────────────────────────────

export function buildTaskVector(title: string, description: string, skills: string[]): {
  keywords: string[];
  tfidfJson: Record<string, number>;
} {
  const text   = `${title} ${description} ${skills.join(" ")}`;
  const tokens = tokenize(text);
  // Use self-IDF for single document (relative weighting)
  const tf     = termFrequency(tokens);
  // Sort by frequency and keep top 25 terms
  const sorted = Object.entries(tf)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 25);
  return {
    keywords: sorted.map(([k]) => k),
    tfidfJson: Object.fromEntries(sorted),
  };
}

// ── Query → ranked match ─────────────────────────────────────────────────────

export function rankByQuery(
  query: string,
  candidates: Array<{ id: string; keywords: string[]; tfidfJson: Record<string, number> }>
): Array<{ id: string; score: number }> {
  const queryTokens = tokenize(query);
  const queryTF     = termFrequency(queryTokens);

  return candidates
    .map((c) => ({
      id:    c.id,
      score: cosineSimilarity(queryTF, c.tfidfJson as Record<string, number>),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
