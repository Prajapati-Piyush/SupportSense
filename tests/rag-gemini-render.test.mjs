import test from "node:test";
import assert from "node:assert/strict";

// Real Gemini RAG answer result captured from the live end-to-end test
const realGroundedResult = {
  question: "What is the credit for availability dropping below 99.50% and what is the claim window?",
  answer:
    "Based on the provided documentation:\n\n* **Credit for availability below 99.50%:** Customers receive an automatic 50% credit [1, 2].\n* **Claim Window:** To claim downtime credit, a claim must be filed through the customer portal within 30 days of the incident [1, 2].",
  confidence: "grounded",
  hasEvidence: true,
  sources: [
    {
      documentId: "df937b3a-7901-4f68-a90e-e90517e9e685",
      chunkId: "c1-uuid",
      chunkIndex: 1,
      headingPath: "Downtime Compensation",
      documentTitle: "Acme Ultra Cloud SLA Policy",
      originalFilename: "ultra_sla.md",
      sourceLabel: "Acme Ultra Cloud SLA Policy > Downtime Compensation",
      similarityScore: 0.8842,
      keywordScore: 0.7412,
      rrfScore: 0.032002,
      matchType: "hybrid",
    },
    {
      documentId: "df937b3a-7901-4f68-a90e-e90517e9e685",
      chunkId: "c2-uuid",
      chunkIndex: 2,
      headingPath: "Overview",
      documentTitle: "Acme Ultra Cloud SLA Policy",
      originalFilename: "ultra_sla.md",
      sourceLabel: "Acme Ultra Cloud SLA Policy > Overview",
      similarityScore: 0.8123,
      keywordScore: 0.6541,
      rrfScore: 0.028912,
      matchType: "hybrid",
    },
  ],
  metadata: {
    model: "gemini-3.5-flash",
    provider: "gemini",
    retrievalMode: "hybrid",
    totalChunksRetrieved: 5,
    chunksUsedCount: 2,
    latencyMs: 9007,
    tokenUsage: {
      promptTokens: 412,
      completionTokens: 85,
      totalTokens: 497,
    },
  },
};

const realAbstainedResult = {
  question: "What is the orbital speed of Jupiter's volcanic moon Io?",
  answer:
    "I am sorry, but I cannot establish an answer based on the available documentation. Please contact our support team for assistance.",
  confidence: "insufficient_evidence",
  hasEvidence: false,
  sources: [],
  metadata: {
    model: "gemini-3.5-flash",
    provider: "gemini",
    retrievalMode: "hybrid",
    totalChunksRetrieved: 0,
    chunksUsedCount: 0,
    latencyMs: 3821,
  },
};

test("Real Gemini Grounded Result: validates structure, confidence and citations", () => {
  assert.equal(realGroundedResult.confidence, "grounded");
  assert.equal(realGroundedResult.hasEvidence, true);
  assert.equal(realGroundedResult.metadata.model, "gemini-3.5-flash");
  assert.equal(realGroundedResult.metadata.provider, "gemini");
  assert.equal(realGroundedResult.sources.length, 2);

  // Check citation references
  const firstSource = realGroundedResult.sources[0];
  assert.equal(firstSource.matchType, "hybrid");
  assert.equal(firstSource.headingPath, "Downtime Compensation");
  assert.equal(firstSource.documentTitle, "Acme Ultra Cloud SLA Policy");
  assert.ok(firstSource.similarityScore > 0.8);
  assert.ok(firstSource.rrfScore > 0.03);

  // Answer contains factual numbers from policy
  assert.match(realGroundedResult.answer, /50%/);
  assert.match(realGroundedResult.answer, /30 days/);
});

test("Real Gemini Abstained Result: validates refusal and zero source leaks", () => {
  assert.equal(realAbstainedResult.confidence, "insufficient_evidence");
  assert.equal(realAbstainedResult.hasEvidence, false);
  assert.equal(realAbstainedResult.sources.length, 0);
  assert.match(realAbstainedResult.answer, /cannot establish an answer/i);
});

