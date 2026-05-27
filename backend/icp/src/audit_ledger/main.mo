import Array "mo:base/Array";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor AuditLedger {
  public type AuditAction = {
    #COMPLAINT_CREATED;
    #STATUS_UPDATED;
    #DEPARTMENT_ASSIGNED;
    #SLA_ESCALATION_TRIGGERED;
    #RESOLUTION_SUBMITTED;
    #COMPLAINT_CLOSED;
    #COMPLAINT_REOPENED;
  };

  public type AuditEventInput = {
    complaintId : Text;
    action : AuditAction;
    actor : Text;
    oldValue : ?Text;
    newValue : ?Text;
    department : ?Text;
    metadataHash : ?Text;
    timestamp : ?Nat64;
  };

  public type AuditEvent = {
    eventId : Nat64;
    complaintId : Text;
    action : AuditAction;
    actor : Text;
    oldValue : ?Text;
    newValue : ?Text;
    department : ?Text;
    metadataHash : ?Text;
    timestamp : Nat64;
  };

  public type VerificationRecordInput = {
    complaintId : Text;
    snapshotHash : Text;
    status : Text;
    department : ?Text;
    resolvedAt : ?Nat64;
    metadataHash : ?Text;
    timestamp : ?Nat64;
  };

  public type VerificationRecord = {
    complaintId : Text;
    snapshotHash : Text;
    status : Text;
    department : ?Text;
    resolvedAt : ?Nat64;
    metadataHash : ?Text;
    timestamp : Nat64;
  };

  stable var nextEventId : Nat64 = 1;
  stable var events : [AuditEvent] = [];
  stable var verificationRecords : [VerificationRecord] = [];

  private func nowNanosAsNat64() : Nat64 {
    let now = Time.now();
    if (now <= 0) {
      return 0;
    };

    Nat64.fromNat(Int.abs(now));
  };

  public shared func addAuditEvent(input : AuditEventInput) : async AuditEvent {
    let record : AuditEvent = {
      eventId = nextEventId;
      complaintId = input.complaintId;
      action = input.action;
      actor = input.actor;
      oldValue = input.oldValue;
      newValue = input.newValue;
      department = input.department;
      metadataHash = input.metadataHash;
      timestamp = switch (input.timestamp) {
        case (?value) value;
        case null nowNanosAsNat64();
      };
    };

    nextEventId += 1;
    events := Array.append<AuditEvent>(events, [record]);

    record;
  };

  public query func getComplaintAuditTrail(complaintId : Text) : async [AuditEvent] {
    Array.filter<AuditEvent>(events, func(record : AuditEvent) : Bool {
      Text.equal(record.complaintId, complaintId);
    });
  };

  public shared func upsertVerificationRecord(input : VerificationRecordInput) : async VerificationRecord {
    let updated : VerificationRecord = {
      complaintId = input.complaintId;
      snapshotHash = input.snapshotHash;
      status = input.status;
      department = input.department;
      resolvedAt = input.resolvedAt;
      metadataHash = input.metadataHash;
      timestamp = switch (input.timestamp) {
        case (?value) value;
        case null nowNanosAsNat64();
      };
    };

    verificationRecords := Array.filter<VerificationRecord>(
      verificationRecords,
      func(record : VerificationRecord) : Bool {
        not Text.equal(record.complaintId, input.complaintId);
      },
    );

    verificationRecords := Array.append<VerificationRecord>(verificationRecords, [updated]);

    updated;
  };

  public query func getVerificationRecord(complaintId : Text) : async ?VerificationRecord {
    var idx = verificationRecords.size();

    while (idx > 0) {
      idx -= 1;
      let record = verificationRecords[idx];

      if (Text.equal(record.complaintId, complaintId)) {
        return ?record;
      };
    };

    null;
  };
}
