export const idlFactory = ({ IDL }) => {
  const AuditAction = IDL.Variant({
    COMPLAINT_CREATED: IDL.Null,
    STATUS_UPDATED: IDL.Null,
    DEPARTMENT_ASSIGNED: IDL.Null,
    SLA_ESCALATION_TRIGGERED: IDL.Null,
    RESOLUTION_SUBMITTED: IDL.Null,
    COMPLAINT_CLOSED: IDL.Null,
    COMPLAINT_REOPENED: IDL.Null,
  });

  const AuditEventInput = IDL.Record({
    complaintId: IDL.Text,
    action: AuditAction,
    actor: IDL.Text,
    oldValue: IDL.Opt(IDL.Text),
    newValue: IDL.Opt(IDL.Text),
    department: IDL.Opt(IDL.Text),
    metadataHash: IDL.Opt(IDL.Text),
    timestamp: IDL.Opt(IDL.Nat64),
  });

  const AuditEvent = IDL.Record({
    eventId: IDL.Nat64,
    complaintId: IDL.Text,
    action: AuditAction,
    actor: IDL.Text,
    oldValue: IDL.Opt(IDL.Text),
    newValue: IDL.Opt(IDL.Text),
    department: IDL.Opt(IDL.Text),
    metadataHash: IDL.Opt(IDL.Text),
    timestamp: IDL.Nat64,
  });

  const VerificationRecordInput = IDL.Record({
    complaintId: IDL.Text,
    snapshotHash: IDL.Text,
    status: IDL.Text,
    department: IDL.Opt(IDL.Text),
    resolvedAt: IDL.Opt(IDL.Nat64),
    metadataHash: IDL.Opt(IDL.Text),
    timestamp: IDL.Opt(IDL.Nat64),
  });

  const VerificationRecord = IDL.Record({
    complaintId: IDL.Text,
    snapshotHash: IDL.Text,
    status: IDL.Text,
    department: IDL.Opt(IDL.Text),
    resolvedAt: IDL.Opt(IDL.Nat64),
    metadataHash: IDL.Opt(IDL.Text),
    timestamp: IDL.Nat64,
  });

  return IDL.Service({
    addAuditEvent: IDL.Func([AuditEventInput], [AuditEvent], []),
    getComplaintAuditTrail: IDL.Func([IDL.Text], [IDL.Vec(AuditEvent)], ["query"]),
    upsertVerificationRecord: IDL.Func([VerificationRecordInput], [VerificationRecord], []),
    getVerificationRecord: IDL.Func([IDL.Text], [IDL.Opt(VerificationRecord)], ["query"]),
  });
};

export const init = () => [];
