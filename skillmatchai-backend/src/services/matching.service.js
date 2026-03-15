// src/services/matching.service.js — TF-IDF + Cosine Similarity Job Matching

// ── Tokenize text ─────────────────────────────────────────────────────────────
const tokenize = (text) => {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
};

// ── Compute Term Frequency for a document ────────────────────────────────────
const computeTF = (tokens) => {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = tokens.length || 1;
  Object.keys(tf).forEach(t => { tf[t] = tf[t] / total; });
  return tf;
};

// ── Compute TF-IDF vectors for all documents ─────────────────────────────────
const computeTFIDF = (documents) => {
  const N       = documents.length;
  const tfVectors = documents.map(doc => computeTF(tokenize(doc)));

  // IDF = log((N+1) / (df+1)) + 1 (smooth)
  const allTerms = new Set(tfVectors.flatMap(Object.keys));
  const idf      = {};
  allTerms.forEach(term => {
    const df  = tfVectors.filter(v => term in v).length;
    idf[term] = Math.log((N + 1) / (df + 1)) + 1;
  });

  // Multiply TF × IDF
  return tfVectors.map(tf => {
    const tfidf = {};
    Object.keys(tf).forEach(t => { tfidf[t] = tf[t] * (idf[t] || 1); });
    return tfidf;
  });
};

// ── Cosine similarity between two vectors ────────────────────────────────────
const cosineSimilarity = (vecA, vecB) => {
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;

  allKeys.forEach(k => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot  += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

// ── Main: Match user skills to job listings ───────────────────────────────────
exports.matchJobsToUser = (userSkills = [], jobs = []) => {
  if (!userSkills.length || !jobs.length) return [];

  // Build text representations
  const userText  = userSkills.join(' ');
  const jobTexts  = jobs.map(job =>
    `${job.title || ''} ${job.description || ''} ${(job.required_skills || []).join(' ')}`
  );

  // All documents: user first, then jobs
  const allDocs      = [userText, ...jobTexts];
  const tfidfVectors = computeTFIDF(allDocs);
  const userVec      = tfidfVectors[0];

  // Score each job
  const scored = jobs.map((job, i) => {
    const jobVec    = tfidfVectors[i + 1];
    const similarity = cosineSimilarity(userVec, jobVec);

    // Bonus: direct skill overlap
    const requiredSkills = (job.required_skills || []).map(s => s.toLowerCase());
    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const overlap  = requiredSkills.filter(s => userSkillsLower.some(u => u.includes(s) || s.includes(u)));
    const overlapBonus = requiredSkills.length > 0
      ? (overlap.length / requiredSkills.length) * 0.3
      : 0;

    const rawScore  = similarity * 0.7 + overlapBonus;
    const matchScore = Math.min(99, Math.round(rawScore * 120)); // Scale to 0-99

    return { ...job, matchScore, skillOverlap: overlap };
  });

  // Sort by match score descending
  return scored.sort((a, b) => b.matchScore - a.matchScore);
};

// ── Compute skill similarity between two skill sets ───────────────────────────
exports.skillSimilarity = (skillsA = [], skillsB = []) => {
  if (!skillsA.length || !skillsB.length) return 0;

  const a = new Set(skillsA.map(s => s.toLowerCase()));
  const b = new Set(skillsB.map(s => s.toLowerCase()));

  const intersection = [...a].filter(s => b.has(s)).length;
  const union        = new Set([...a, ...b]).size;

  return union > 0 ? Math.round((intersection / union) * 100) : 0;
};
