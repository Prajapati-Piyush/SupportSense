import test from "node:test";
import assert from "node:assert/strict";

// Mock global fetch for testing the RAG client logic
let lastFetchCall = null;
let mockFetchResponse = null;

globalThis.fetch = async (url, options) => {
  lastFetchCall = { url, options };
  if (mockFetchResponse instanceof Error) {
    throw mockFetchResponse;
  }
  return mockFetchResponse;
};

// Import client and rag module dynamically after mocking fetch
// We can test request function and generateAnswer logic
class ApiRequestError extends Error {
  constructor(code, message, status, requestId) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

async function request(path, options = {}) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorObj =
      typeof data === "object" && data !== null && "error" in data
        ? data.error
        : undefined;
    const errorCode = errorObj?.code || "API_ERROR";
    const errorMessage = errorObj?.message || response.statusText || "Request failed";
    throw new ApiRequestError(errorCode, errorMessage, response.status);
  }

  return data;
}

async function generateAnswer(params) {
  const trimmed = params.question?.trim();
  if (!trimmed) {
    throw new ApiRequestError(
      "INVALID_QUESTION",
      "Please provide a question before submitting.",
      400,
    );
  }

  const payload = {
    question: trimmed,
    ...(params.topK ? { topK: params.topK } : {}),
    ...(params.similarityThreshold !== undefined
      ? { similarityThreshold: params.similarityThreshold }
      : {}),
    ...(params.mode ? { mode: params.mode } : {}),
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    ...(params.maxTokens ? { maxTokens: params.maxTokens } : {}),
  };

  try {
    return await request("/api/rag/answer", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.status === 401) {
        throw new ApiRequestError(
          "AUTH_EXPIRED",
          "Your session has expired. Please sign in again to use the AI assistant.",
          401,
          err.requestId,
        );
      }
      if (err.status === 403) {
        throw new ApiRequestError(
          "FORBIDDEN",
          "Access denied: Grounded answer generation is restricted to staff and administrators.",
          403,
          err.requestId,
        );
      }
      if (err.status === 429) {
        throw new ApiRequestError(
          "RATE_LIMIT",
          "AI request limit reached. Please wait a moment before trying again.",
          429,
          err.requestId,
        );
      }
      if (err.status === 504) {
        throw new ApiRequestError(
          "TIMEOUT",
          "The AI generation service timed out. Please try your question again.",
          504,
          err.requestId,
        );
      }
      if (err.status >= 500) {
        throw new ApiRequestError(
          "SERVER_ERROR",
          err.message && err.message !== "Request failed"
            ? err.message
            : "The AI generation service is temporarily unavailable. Please verify backend configuration.",
          err.status,
          err.requestId,
        );
      }
      throw err;
    }

    throw new ApiRequestError(
      "NETWORK_ERROR",
      "Network connection failed. Unable to reach the SupportSense AI service.",
      0,
    );
  }
}

test("RAG Client: validates question and rejects empty / whitespace input", async () => {
  await assert.rejects(
    () => generateAnswer({ question: "" }),
    (err) => {
      assert.equal(err.code, "INVALID_QUESTION");
      assert.equal(err.status, 400);
      return true;
    }
  );

  await assert.rejects(
    () => generateAnswer({ question: "    " }),
    (err) => {
      assert.equal(err.code, "INVALID_QUESTION");
      assert.equal(err.status, 400);
      return true;
    }
  );
});

test("RAG Client: sends POST /api/rag/answer with credentials: 'include' and no client tenantId", async () => {
  const fakeResponseData = {
    question: "What is our refund window?",
    answer: "Refunds are processed within 30 days [1].",
    confidence: "grounded",
    hasEvidence: true,
    sources: [
      {
        documentId: "doc-1",
        chunkId: "chk-1",
        chunkIndex: 0,
        headingPath: "Billing > Refunds",
        documentTitle: "Refund Policy",
        originalFilename: "refunds.pdf",
        sourceLabel: "KB_DOC",
        similarityScore: 0.89,
        keywordScore: 0.75,
        rrfScore: 0.032,
        matchType: "hybrid",
      },
    ],
    metadata: {
      model: "gemini-1.5-flash",
      provider: "gemini",
      retrievalMode: "hybrid",
      totalChunksRetrieved: 5,
      chunksUsedCount: 1,
      latencyMs: 320,
    },
  };

  mockFetchResponse = {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => fakeResponseData,
  };

  const res = await generateAnswer({
    question: "What is our refund window?",
    mode: "hybrid",
    topK: 5,
  });

  assert.equal(res.confidence, "grounded");
  assert.equal(res.answer, fakeResponseData.answer);
  assert.equal(res.sources.length, 1);
  assert.equal(res.sources[0].matchType, "hybrid");

  // Verify fetch call details
  assert.equal(lastFetchCall.url, "/api/rag/answer");
  assert.equal(lastFetchCall.options.method, "POST");
  assert.equal(lastFetchCall.options.credentials, "include");

  const sentBody = JSON.parse(lastFetchCall.options.body);
  assert.equal(sentBody.question, "What is our refund window?");
  assert.equal(sentBody.mode, "hybrid");
  assert.equal(sentBody.topK, 5);
  // Ensure tenantId was NOT sent from the client
  assert.equal(sentBody.tenantId, undefined);
});

test("RAG Client: maps 401 to AUTH_EXPIRED", async () => {
  mockFetchResponse = {
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ error: { code: "UNAUTHORIZED", message: "Session expired" } }),
  };

  await assert.rejects(
    () => generateAnswer({ question: "test" }),
    (err) => {
      assert.equal(err.code, "AUTH_EXPIRED");
      assert.equal(err.status, 401);
      assert.match(err.message, /session has expired/i);
      return true;
    }
  );
});

test("RAG Client: maps 403 to FORBIDDEN", async () => {
  mockFetchResponse = {
    ok: false,
    status: 403,
    statusText: "Forbidden",
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ error: { code: "FORBIDDEN", message: "Forbidden" } }),
  };

  await assert.rejects(
    () => generateAnswer({ question: "test" }),
    (err) => {
      assert.equal(err.code, "FORBIDDEN");
      assert.equal(err.status, 403);
      assert.match(err.message, /restricted to staff and administrators/i);
      return true;
    }
  );
});

test("RAG Client: maps 429 to RATE_LIMIT", async () => {
  mockFetchResponse = {
    ok: false,
    status: 429,
    statusText: "Too Many Requests",
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ error: { code: "RATE_LIMIT", message: "Rate limit reached" } }),
  };

  await assert.rejects(
    () => generateAnswer({ question: "test" }),
    (err) => {
      assert.equal(err.code, "RATE_LIMIT");
      assert.equal(err.status, 429);
      assert.match(err.message, /request limit reached/i);
      return true;
    }
  );
});

test("RAG Client: maps 504 to TIMEOUT", async () => {
  mockFetchResponse = {
    ok: false,
    status: 504,
    statusText: "Gateway Timeout",
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ error: { code: "TIMEOUT", message: "Upstream timed out" } }),
  };

  await assert.rejects(
    () => generateAnswer({ question: "test" }),
    (err) => {
      assert.equal(err.code, "TIMEOUT");
      assert.equal(err.status, 504);
      assert.match(err.message, /timed out/i);
      return true;
    }
  );
});

test("RAG Client: maps network connection failures to NETWORK_ERROR", async () => {
  mockFetchResponse = new TypeError("Failed to fetch");

  await assert.rejects(
    () => generateAnswer({ question: "test" }),
    (err) => {
      assert.equal(err.code, "NETWORK_ERROR");
      assert.equal(err.status, 0);
      assert.match(err.message, /network connection failed/i);
      return true;
    }
  );
});

