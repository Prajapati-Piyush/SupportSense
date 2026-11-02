import { request, ApiRequestError } from "./client";

export interface AnswerSource {
  documentId: string;
  chunkId: string;
  chunkIndex: number;
  headingPath: string | null;
  documentTitle: string;
  originalFilename: string;
  sourceLabel: string;
  similarityScore: number | null;
  keywordScore: number | null;
  rrfScore: number | null;
  matchType: "semantic" | "keyword" | "hybrid";
}

export interface GroundedAnswerRequest {
  question: string;
  topK?: number;
  similarityThreshold?: number;
  mode?: "hybrid" | "semantic" | "keyword";
  temperature?: number;
  maxTokens?: number;
}

export interface GroundedAnswerResult {
  question: string;
  answer: string;
  confidence: "grounded" | "insufficient_evidence" | "no_context";
  hasEvidence: boolean;
  sources: AnswerSource[];
  metadata: {
    model: string;
    provider: string;
    retrievalMode: string;
    totalChunksRetrieved: number;
    chunksUsedCount: number;
    latencyMs: number;
    tokenUsage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}

/**
 * Calls backend POST /api/rag/answer to generate a grounded support answer
 * strictly based on retrieved documentation evidence.
 *
 * Multi-tenant isolation is enforced automatically on the server via session cookie.
 * No client-side tenant ID is sent.
 */
export async function generateAnswer(
  params: GroundedAnswerRequest,
): Promise<GroundedAnswerResult> {
  const trimmed = params.question?.trim();
  if (!trimmed) {
    throw new ApiRequestError(
      "INVALID_QUESTION",
      "Please provide a question before submitting.",
      400,
    );
  }

  const payload: GroundedAnswerRequest = {
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
    return await request<GroundedAnswerResult>("/api/rag/answer", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err: unknown) {
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

