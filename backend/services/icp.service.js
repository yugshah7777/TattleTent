import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import { createHash } from "crypto";
import { idlFactory } from "./icp.idl.js";

const ICP_ENABLED = process.env.ICP_ENABLED === "true";
const ICP_HOST = process.env.ICP_HOST || "http://127.0.0.1:4943";
const ICP_CANISTER_ID = process.env.ICP_AUDIT_CANISTER_ID || "";
const ICP_RETRY_ATTEMPTS = Number.parseInt(process.env.ICP_RETRY_ATTEMPTS || "2", 10);
const ICP_RETRY_BACKOFF_MS = Number.parseInt(process.env.ICP_RETRY_BACKOFF_MS || "350", 10);
const DIAGNOSTIC_FAILURE_LIMIT = 50;

let actorPromise = null;
let missingConfigLogged = false;
const diagnostics = {
  totalQueuedWrites: 0,
  totalWriteSuccesses: 0,
  totalWriteFailures: 0,
  totalReadCalls: 0,
  totalReadFailures: 0,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastFailureMessage: null,
  recentFailures: [],
};

const ACTION_VARIANTS = {
  COMPLAINT_CREATED: { COMPLAINT_CREATED: null },
  STATUS_UPDATED: { STATUS_UPDATED: null },
  DEPARTMENT_ASSIGNED: { DEPARTMENT_ASSIGNED: null },
  SLA_ESCALATION_TRIGGERED: { SLA_ESCALATION_TRIGGERED: null },
  RESOLUTION_SUBMITTED: { RESOLUTION_SUBMITTED: null },
  COMPLAINT_CLOSED: { COMPLAINT_CLOSED: null },
  COMPLAINT_REOPENED: { COMPLAINT_REOPENED: null },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nowIso = () => new Date().toISOString();

const pushFailure = (entry) => {
  diagnostics.recentFailures.unshift(entry);
  if (diagnostics.recentFailures.length > DIAGNOSTIC_FAILURE_LIMIT) {
    diagnostics.recentFailures = diagnostics.recentFailures.slice(0, DIAGNOSTIC_FAILURE_LIMIT);
  }
};

const toOptText = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [String(value)];
};

const toOptNat64FromDate = (value) => {
  if (!value) return [];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return [];

  return [BigInt(date.getTime()) * 1_000_000n];
};

const fromOpt = (value) => (Array.isArray(value) && value.length > 0 ? value[0] : null);
const actionToString = (value) => Object.keys(value || {})[0] || "UNKNOWN";

const nsToIso = (nsValue) => {
  try {
    const ns = BigInt(nsValue);
    const millis = Number(ns / 1_000_000n);
    return Number.isFinite(millis) ? new Date(millis).toISOString() : null;
  } catch {
    return null;
  }
};

const isConfigured = () => ICP_ENABLED && Boolean(ICP_CANISTER_ID);

const logIcp = (level, message, meta = {}) => {
  const payload = {
    layer: "icp",
    host: ICP_HOST,
    canisterId: ICP_CANISTER_ID || "unset",
    ...meta,
  };

  if (level === "warn") {
    console.warn(`[ICP] ${message}`, payload);
    return;
  }
  if (level === "error") {
    console.error(`[ICP] ${message}`, payload);
    return;
  }

  console.log(`[ICP] ${message}`, payload);
};

const getActor = async () => {
  if (!isConfigured()) {
    if (!missingConfigLogged) {
      logIcp("warn", "ICP integration disabled (missing config or explicitly disabled)");
      missingConfigLogged = true;
    }
    return null;
  }

  if (!actorPromise) {
    actorPromise = (async () => {
      const agent = new HttpAgent({ host: ICP_HOST });

      if (ICP_HOST.includes("127.0.0.1") || ICP_HOST.includes("localhost")) {
        try {
          await agent.fetchRootKey();
        } catch (error) {
          logIcp("warn", "Unable to fetch root key for local replica", { error: error.message });
        }
      }

      return Actor.createActor(idlFactory, {
        agent,
        canisterId: ICP_CANISTER_ID,
      });
    })();
  }

  return actorPromise;
};

const withRetry = async (task, context) => {
  let lastError = null;

  for (let attempt = 1; attempt <= Math.max(1, ICP_RETRY_ATTEMPTS); attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      logIcp("warn", "ICP call failed", {
        context,
        attempt,
        maxAttempts: ICP_RETRY_ATTEMPTS,
        error: error.message,
      });

      if (attempt < ICP_RETRY_ATTEMPTS) {
        await sleep(ICP_RETRY_BACKOFF_MS * attempt);
      }
    }
  }

  throw lastError;
};

const normalizeDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export const buildComplaintSnapshotHash = ({
  complaintId,
  department,
  status,
  createdAt,
  resolvedAt,
}) => {
  const payload = [
    String(complaintId ?? ""),
    String(department ?? ""),
    String(status ?? ""),
    normalizeDate(createdAt),
    normalizeDate(resolvedAt),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
};

export const queueAuditEvent = (event) => {
  diagnostics.totalQueuedWrites += 1;
  void recordAuditEvent(event).catch((error) => {
    diagnostics.totalWriteFailures += 1;
    diagnostics.lastFailureAt = nowIso();
    diagnostics.lastFailureMessage = error.message;
    pushFailure({
      at: diagnostics.lastFailureAt,
      kind: "AUDIT_WRITE",
      complaintId: event?.complaintId ? String(event.complaintId) : null,
      action: event?.action || null,
      error: error.message,
    });
    logIcp("error", "Audit event write exhausted retries", {
      complaintId: event?.complaintId,
      action: event?.action,
      error: error.message,
    });
  });
};

export const queueVerificationRecord = (snapshot) => {
  diagnostics.totalQueuedWrites += 1;
  void upsertVerificationRecord(snapshot).catch((error) => {
    diagnostics.totalWriteFailures += 1;
    diagnostics.lastFailureAt = nowIso();
    diagnostics.lastFailureMessage = error.message;
    pushFailure({
      at: diagnostics.lastFailureAt,
      kind: "PROOF_WRITE",
      complaintId: snapshot?.complaintId ? String(snapshot.complaintId) : null,
      action: "UPSERT_VERIFICATION_RECORD",
      error: error.message,
    });
    logIcp("error", "Verification record write exhausted retries", {
      complaintId: snapshot?.complaintId,
      error: error.message,
    });
  });
};

export const recordAuditEvent = async ({
  complaintId,
  action,
  actor,
  oldValue = null,
  newValue = null,
  department = null,
  metadataHash = null,
  timestamp = null,
}) => {
  const service = await getActor();
  if (!service) return null;

  const actionVariant = ACTION_VARIANTS[action];
  if (!actionVariant) {
    throw new Error(`Unsupported audit action: ${action}`);
  }

  const payload = {
    complaintId: String(complaintId),
    action: actionVariant,
    actor: String(actor || "SYSTEM"),
    oldValue: toOptText(oldValue),
    newValue: toOptText(newValue),
    department: toOptText(department),
    metadataHash: toOptText(metadataHash),
    timestamp: toOptNat64FromDate(timestamp),
  };

  const result = await withRetry(
    () => service.addAuditEvent(payload),
    `addAuditEvent:${payload.complaintId}:${action}`,
  );
  diagnostics.totalWriteSuccesses += 1;
  diagnostics.lastSuccessAt = nowIso();

  return {
    eventId: result.eventId?.toString?.() || String(result.eventId),
    complaintId: result.complaintId,
    action: actionToString(result.action),
    actor: result.actor,
    oldValue: fromOpt(result.oldValue),
    newValue: fromOpt(result.newValue),
    department: fromOpt(result.department),
    metadataHash: fromOpt(result.metadataHash),
    timestampNs: result.timestamp?.toString?.() || String(result.timestamp),
    timestamp: nsToIso(result.timestamp),
  };
};

export const upsertVerificationRecord = async ({
  complaintId,
  snapshotHash,
  status,
  department = null,
  resolvedAt = null,
  metadataHash = null,
  timestamp = null,
}) => {
  const service = await getActor();
  if (!service) return null;

  const payload = {
    complaintId: String(complaintId),
    snapshotHash: String(snapshotHash),
    status: String(status ?? ""),
    department: toOptText(department),
    resolvedAt: toOptNat64FromDate(resolvedAt),
    metadataHash: toOptText(metadataHash),
    timestamp: toOptNat64FromDate(timestamp),
  };

  const result = await withRetry(
    () => service.upsertVerificationRecord(payload),
    `upsertVerificationRecord:${payload.complaintId}`,
  );
  diagnostics.totalWriteSuccesses += 1;
  diagnostics.lastSuccessAt = nowIso();

  return {
    complaintId: result.complaintId,
    snapshotHash: result.snapshotHash,
    status: result.status,
    department: fromOpt(result.department),
    resolvedAtNs: fromOpt(result.resolvedAt)?.toString?.() || (fromOpt(result.resolvedAt) ? String(fromOpt(result.resolvedAt)) : null),
    resolvedAt: fromOpt(result.resolvedAt) ? nsToIso(fromOpt(result.resolvedAt)) : null,
    metadataHash: fromOpt(result.metadataHash),
    timestampNs: result.timestamp?.toString?.() || String(result.timestamp),
    timestamp: nsToIso(result.timestamp),
  };
};

export const getComplaintAuditTrailFromIcp = async (complaintId) => {
  const service = await getActor();
  if (!service) return [];

  let rows = [];
  diagnostics.totalReadCalls += 1;
  try {
    rows = await withRetry(
      () => service.getComplaintAuditTrail(String(complaintId)),
      `getComplaintAuditTrail:${complaintId}`,
    );
  } catch (error) {
    diagnostics.totalReadFailures += 1;
    diagnostics.lastFailureAt = nowIso();
    diagnostics.lastFailureMessage = error.message;
    pushFailure({
      at: diagnostics.lastFailureAt,
      kind: "AUDIT_READ",
      complaintId: String(complaintId),
      action: "GET_AUDIT_TRAIL",
      error: error.message,
    });
    throw error;
  }

  return (rows || []).map((row) => ({
    eventId: row.eventId?.toString?.() || String(row.eventId),
    complaintId: row.complaintId,
    action: actionToString(row.action),
    actor: row.actor,
    oldValue: fromOpt(row.oldValue),
    newValue: fromOpt(row.newValue),
    department: fromOpt(row.department),
    metadataHash: fromOpt(row.metadataHash),
    timestampNs: row.timestamp?.toString?.() || String(row.timestamp),
    timestamp: nsToIso(row.timestamp),
  }));
};

export const getVerificationRecordFromIcp = async (complaintId) => {
  const service = await getActor();
  if (!service) return null;

  let row = null;
  diagnostics.totalReadCalls += 1;
  try {
    row = await withRetry(
      () => service.getVerificationRecord(String(complaintId)),
      `getVerificationRecord:${complaintId}`,
    );
  } catch (error) {
    diagnostics.totalReadFailures += 1;
    diagnostics.lastFailureAt = nowIso();
    diagnostics.lastFailureMessage = error.message;
    pushFailure({
      at: diagnostics.lastFailureAt,
      kind: "PROOF_READ",
      complaintId: String(complaintId),
      action: "GET_VERIFICATION_RECORD",
      error: error.message,
    });
    throw error;
  }

  const record = fromOpt(row);
  if (!record) return null;

  const resolvedAtNs = fromOpt(record.resolvedAt);

  return {
    complaintId: record.complaintId,
    snapshotHash: record.snapshotHash,
    status: record.status,
    department: fromOpt(record.department),
    resolvedAtNs: resolvedAtNs ? resolvedAtNs.toString() : null,
    resolvedAt: resolvedAtNs ? nsToIso(resolvedAtNs) : null,
    metadataHash: fromOpt(record.metadataHash),
    timestampNs: record.timestamp?.toString?.() || String(record.timestamp),
    timestamp: nsToIso(record.timestamp),
  };
};

export const isIcpReady = () => isConfigured();

export const getIcpDiagnostics = () => ({
  enabled: ICP_ENABLED,
  configured: isConfigured(),
  ready: isConfigured(),
  host: ICP_HOST,
  canisterId: ICP_CANISTER_ID || null,
  retryAttempts: ICP_RETRY_ATTEMPTS,
  retryBackoffMs: ICP_RETRY_BACKOFF_MS,
  counters: {
    totalQueuedWrites: diagnostics.totalQueuedWrites,
    totalWriteSuccesses: diagnostics.totalWriteSuccesses,
    totalWriteFailures: diagnostics.totalWriteFailures,
    totalReadCalls: diagnostics.totalReadCalls,
    totalReadFailures: diagnostics.totalReadFailures,
  },
  lastSuccessAt: diagnostics.lastSuccessAt,
  lastFailureAt: diagnostics.lastFailureAt,
  lastFailureMessage: diagnostics.lastFailureMessage,
  recentFailures: diagnostics.recentFailures,
});
