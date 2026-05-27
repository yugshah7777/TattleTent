import pool from "../db/db.js";
import {
  buildComplaintSnapshotHash,
  getVerificationRecordFromIcp,
  isIcpReady,
  queueVerificationRecord,
} from "./icp.service.js";

export const getComplaintProofSnapshot = async (complaintId) => {
  const query = await pool.query(
    `SELECT
      c.complaint_id,
      c.status,
      c.submitted_at,
      c.updated_at,
      d.dept_name AS department
    FROM complaints c
    LEFT JOIN departments d ON c.dept_id = d.dept_id
    WHERE c.complaint_id = $1
    LIMIT 1`,
    [complaintId],
  );

  if (query.rowCount === 0) return null;

  const row = query.rows[0];
  return {
    complaintId: row.complaint_id,
    department: row.department || null,
    status: row.status || null,
    createdAt: row.submitted_at || null,
    resolvedAt: row.status === "Resolved" ? row.updated_at : null,
  };
};

export const queueComplaintVerificationSync = async (complaintId) => {
  const snapshot = await getComplaintProofSnapshot(complaintId);
  if (!snapshot) return;

  const snapshotHash = buildComplaintSnapshotHash(snapshot);
  queueVerificationRecord({
    complaintId: snapshot.complaintId,
    snapshotHash,
    status: snapshot.status,
    department: snapshot.department,
    resolvedAt: snapshot.resolvedAt,
    metadataHash: null,
    timestamp: new Date(),
  });
};

export const verifyComplaintAgainstBlockchain = async (complaintId) => {
  const snapshot = await getComplaintProofSnapshot(complaintId);
  if (!snapshot) {
    return {
      exists: false,
      complaintId,
      verified: false,
      status: "NOT_FOUND",
    };
  }

  const backendHash = buildComplaintSnapshotHash(snapshot);

  if (!isIcpReady()) {
    return {
      exists: true,
      complaintId: snapshot.complaintId,
      verified: false,
      status: "ICP_NOT_CONFIGURED",
      backendHash,
      chainHash: null,
      snapshot,
    };
  }

  let chainRecord = null;
  try {
    chainRecord = await getVerificationRecordFromIcp(snapshot.complaintId);
  } catch (error) {
    return {
      exists: true,
      complaintId: snapshot.complaintId,
      verified: false,
      status: "ICP_UNAVAILABLE",
      backendHash,
      chainHash: null,
      snapshot,
      error: error.message,
    };
  }

  if (!chainRecord) {
    return {
      exists: true,
      complaintId: snapshot.complaintId,
      verified: false,
      status: "NO_CHAIN_RECORD",
      backendHash,
      chainHash: null,
      snapshot,
    };
  }

  const verified = chainRecord.snapshotHash === backendHash;

  return {
    exists: true,
    complaintId: snapshot.complaintId,
    verified,
    status: verified ? "VERIFIED" : "HASH_MISMATCH",
    backendHash,
    chainHash: chainRecord.snapshotHash,
    chainRecord,
    snapshot,
  };
};
