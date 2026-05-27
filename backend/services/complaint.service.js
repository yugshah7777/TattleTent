
import pool from '../db/db.js';
import { notifyAdminForManualReassignment } from './notification.service.js';
import { queueAuditEvent } from './icp.service.js';
import { queueComplaintVerificationSync } from './complaintProof.service.js';

const getMaxEscalations = (priority) => {
  if (priority === "High") return 3;
  if (priority === "Medium") return 2;
  return 1;
};



// ✅ Save complaint — auto-assign dept_id based on category
export const saveComplaintToDB = async (newComplaint) => {
  try {
    // 1️⃣ Find the department ID based on the category selected by user
    const deptResult = await pool.query(
      "SELECT dept_id FROM departments WHERE dept_name ILIKE $1",
      [newComplaint.category]
    );

    if (deptResult.rowCount === 0) {
      throw new Error(`No department found for category: ${newComplaint.category}`);
    }

    const dept_id = deptResult.rows[0].dept_id;

    // 2️⃣ Insert complaint into the database with default values
    const complaintResult = await pool.query(
      `INSERT INTO complaints 
        (title, description, status, photo, category, location, dept_id, priority, user_id, longitude, latitude, geolocation)
       VALUES (
        $1, $2, 'New', $3, $4, $5, $6, $7, $8, $9, $10,
        CASE
          WHEN $9 IS NOT NULL AND $10 IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint($9::double precision, $10::double precision), 4326)
          ELSE NULL
        END
       )
       RETURNING complaint_id, title, description, category, dept_id, priority, status, location, photo, submitted_at`,
      [
        newComplaint.title,
        newComplaint.description,
        newComplaint.photo,
        newComplaint.category,
        newComplaint.location,
        dept_id,
        newComplaint.priority || "Low",
        newComplaint.user_id,
        newComplaint.longitude,
        newComplaint.latitude,
      ]
    );

    // 3️⃣ Return the inserted complaint
    return complaintResult.rows[0];
  } catch (err) {
    console.error("❌ Error saving complaint:", err.message);
    throw err;
  }
};

export const getComplaintLifecycleContext = async (id) => {
  const result = await pool.query(
    `SELECT
      c.complaint_id,
      c.status,
      c.priority,
      c.staff_id,
      c.assigned_to,
      c.submitted_at,
      c.updated_at,
      d.dept_name AS department
    FROM complaints c
    LEFT JOIN departments d ON c.dept_id = d.dept_id
    WHERE c.complaint_id = $1
    LIMIT 1`,
    [id]
  );

  return result.rowCount > 0 ? result.rows[0] : null;
};

// ✅ Update complaint (Revised to fix specific bugs)
/**
 * Update complaint status or priority in the database.
 * - If only one field is provided, keeps the other unchanged.
 * - If priority changes, automatically updates the SLA deadline based on the current time.
 */
export const updateComplaintStatusInDB = async (id, newStatus, staffId, priority) => {
  try {

    // 1️⃣ Update status in the database
    if(staffId) {
      const staffName = await pool.query(
        `SELECT name FROM users WHERE user_id = $1`, [staffId]
      );
      await pool.query(
        `UPDATE complaints
        SET staff_id = $1, assigned_to = $2
        WHERE complaint_id = $3`,
        [staffId, staffName.rows[0].name, id]
      );
    }
    if(newStatus==='In Progress'){
      newStatus="IN_PROGRESS";
    }
    let updatedComplaint;
    if(newStatus==='Resolved') {
      const complaintResult = await pool.query(
        `SELECT staff_id, temp_points FROM complaints WHERE complaint_id = $1`,
        [id]
      );

      if (complaintResult.rowCount === 0) return null;

      const complaint = complaintResult.rows[0];
      const assignedStaffId = staffId || complaint.staff_id;

      if (assignedStaffId) {
        await pool.query(
          `UPDATE users
           SET points = COALESCE(points, 0) + COALESCE($1, 0)
           WHERE user_id = $2`,
          [complaint.temp_points, assignedStaffId]
        );
      }

      updatedComplaint = await pool.query(
        `UPDATE complaints
         SET status = $1,
             priority = COALESCE($2, priority),
             updated_at = NOW()
         WHERE complaint_id = $3
         RETURNING complaint_id, title, description, photo, location, category, status, priority, sla_deadline, updated_at`,
        [newStatus, priority, id]
      );
    } else {
      updatedComplaint = await pool.query(
        `UPDATE complaints
        SET status = $1,
            priority = COALESCE($2, priority),
            updated_at = NOW()
        WHERE complaint_id = $3
        RETURNING complaint_id, title, description, photo, location, category, status, priority, sla_deadline, updated_at`,
        [newStatus, priority, id]
      );
    }

    return updatedComplaint.rows[0];
  } catch (err) {
    console.error("Error updating complaint status:", err.message);
    throw err;
  }
};

export const updateComplaintPriorityInDB = async (id, newPriority) => {
  try {
    // 1️⃣ Fetch existing complaint, including necessary fields for SLA calculation
    const existingComplaint = await pool.query(
      `SELECT complaint_id, status, priority, dept_id, sla_deadline
       FROM complaints WHERE complaint_id = $1`,
      [id]
    );
    
    if (existingComplaint.rowCount === 0) return null;
    const complaint = existingComplaint.rows[0];

    // Check if priority is actually changing
    if (newPriority === complaint.priority && complaint.sla_deadline!==null) {
        console.log(`Priority for ID ${id} is already ${newPriority}. No update needed.`);
        return complaint; // Return the existing complaint data
    }
    
    let newSlaDeadline = complaint.sla_deadline; // Initialize with the existing deadline

    // 2️⃣ Fetch the new SLA rule (time_limit)
    const slaRes = await pool.query(
      `SELECT time_limit 
       FROM sla_rules 
       WHERE dept_id = $1 AND priority = $2 
       LIMIT 1`,
      [complaint.dept_id, newPriority]
    );
    
    // 3️⃣ Recalculate the deadline if a rule is found
    if (slaRes.rowCount > 0) {
      const timeLimit = slaRes.rows[0].time_limit; // PostgreSQL INTERVAL

      // Let the database calculate the new deadline (NOW() + INTERVAL)
      const deadlineRes = await pool.query("SELECT NOW() + $1 AS new_deadline", [timeLimit]);
      newSlaDeadline = deadlineRes.rows[0].new_deadline;
    } else {
        console.warn(`No SLA rule found for Dept ID ${complaint.dept_id} and Priority ${newPriority}. Keeping old SLA deadline.`);
    }

    // 4️⃣ Update priority and sla_deadline in the database
    const updatedComplaint = await pool.query(
      `UPDATE complaints
       SET priority = $1,
           sla_deadline = $2,
           updated_at = NOW()
       WHERE complaint_id = $3
       RETURNING complaint_id, title, description, photo, location, category, status, priority, sla_deadline, updated_at`,
      [newPriority, newSlaDeadline, id]
    );

    return updatedComplaint.rows[0];
  } catch (err) {
    console.error("Error updating complaint priority:", err.message);
    throw err;
  }
};

// ✅ Delete complaint
export const deleteComplaintFromDB = async (id) => {
  const ck = await pool.query(
    'SELECT * FROM complaints WHERE complaint_id = $1', [id]
  );
  if(ck.rows.length === 0) return false;
  await pool.query(
    'DELETE FROM complaints WHERE complaint_id = $1', [id]
  );
  return true; // true if deleted
};

// total count
export const getComplaintCounts = async () => {
  try {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status='Resolved') AS resolved,
        COUNT(*) FILTER (WHERE status='New') AS pending,
        COUNT(*) FILTER (WHERE status='IN_PROGRESS') AS in_progress
      FROM complaints
    `;

    const result = await pool.query(query);
    return result.rows[0] || { resolved: 0, pending: 0, in_progress: 0 };
  } catch (err) {
    console.error('Error in getComplaintCounts:', err);
    throw err;
  }
};


// search and filter

export const searchComplaints = async (filters) => {
  let {
    user_id,
    searchText,
    category,
    status,
    location,
    fromDate,
    toDate,
    page,
    limit,
    sortBy,
    order,
    staff_id
  } = filters;

  // Ensure page & limit are valid integers
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  let query = 'SELECT * FROM complaints WHERE 1=1';
  const params = [];
  let idx = 1;

  // Text search
  if (searchText) {
    query += ` AND (title ILIKE $${idx} OR description ILIKE $${idx})`;
    params.push(`%${searchText}%`);
    idx++;
  }

  if (user_id) {
    query += ` AND user_id = $${idx}`;
    params.push(user_id);
    idx++;
  }

  if (staff_id) {
    query += ` AND staff_id = $${idx}`;
    params.push(staff_id);
    idx++;
  }

  // Filters
  if (category) {
    query += ` AND category = $${idx}`;
    params.push(category);
    idx++;
  }
  if (status) {
    query += ` AND status = $${idx}`;
    params.push(status);
    idx++;
  }
  if (location) {
    query += ` AND location = $${idx}`;
    params.push(location);
    idx++;
  }
  if (fromDate) {
    query += ` AND submitted_at >= $${idx}`;
    params.push(fromDate);
    idx++;
  }
  if (toDate) {
    query += ` AND submitted_at <= $${idx}`;
    params.push(toDate);
    idx++;
  }

  // Sorting
  const validSort = ['submitted_at', 'status', 'category', 'sla_deadline'];
  const validOrder = ['asc', 'desc'];
  const sortColumn = validSort.includes(sortBy) ? sortBy : 'submitted_at';
  const sortOrder = validOrder.includes((order || '').toLowerCase()) ? order.toUpperCase() : 'DESC';
  query += ` ORDER BY ${sortColumn} ${sortOrder}`;

  // Pagination
  // const offset = (page - 1) * limit;
  // query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
  // params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Calculate SLA deadline based on dept_id and priority.
 * Looks up SLA days from the sla_rules table.
 */
/**
 * Fetches the SLA interval for a given department and priority.
 * It's designed to work with a PostgreSQL INTERVAL data type.
 * @param {string} dept_id - The ID of the department.
 * @param {string} priority - The priority level.
 * @returns {Promise<string|null>} The interval string (e.g., '72 hours') or a fallback if not found.
 */
export const calculateSlaDeadline = async (dept_id, priority) => {
  try {
    const slaResult = await pool.query(
      `SELECT time_limit FROM sla_rules WHERE dept_id = $1 AND priority = $2 LIMIT 1;`,
      [dept_id, priority]
    );

    // If no rule is found, return a default fallback interval.
    if (slaResult.rowCount === 0) {
      console.warn(`⚠️ No SLA rule found for dept_id ${dept_id}, priority ${priority}. Using default 24 hours.`);
      return '24 hours';
    }
    
    // Directly return the interval from the database (e.g., { hours: 72 }).
    // The 'pg' driver often returns intervals as objects. We'll let PostgreSQL handle it.
    return slaResult.rows[0].time_limit;

  } catch (error) {
    console.error("❌ Error fetching SLA interval:", error);
    // On any error, return a safe fallback to prevent crashes.
    return '24 hours';
  }
};

/**
 * 🔁 Escalate complaints whose SLA deadline is breached.
 * Returns all complaints that were escalated.
 */

export const escalateComplaintsByCategory = async () => {
  try {
    // 1️⃣ Find overdue complaints (SLA passed, still unresolved)
    const overdue = await pool.query(`
      SELECT complaint_id, title, priority, status, staff_id,temp_points,dept_id
      FROM complaints
      WHERE status IN ('New', 'IN_PROGRESS')
      AND sla_deadline < NOW();
    `);

    if (overdue.rowCount === 0) {
      console.log("✅ No overdue complaints found for escalation.");
      return [];
    }

    const escalatedComplaints = [];

    for (const c of overdue.rows) {
      const previousPriority = c.priority;
      const previousStatus = c.status;
      const newSlaDeadline = await calculateSlaDeadline(c.dept_id, c.priority);


      if(c.priority==='Low' || c.priority==='Medium'){
        if(c.priority==='Low'){
          await pool.query(`
            UPDATE complaints
            SET priority='Medium',
              updated_at=NOW(),
              sla_deadline = NOW() + $1::interval,
              temp_points=$2
            WHERE complaint_id=$3;
          `,[newSlaDeadline,c.temp_points-1,c.complaint_id]);
        }
        else{
          await pool.query(`
            UPDATE complaints
            SET priority='High',
              updated_at=NOW(),
              sla_deadline=NOW() + $1::interval,
              temp_points=$2
            WHERE complaint_id=$3;
          `,[newSlaDeadline,c.temp_points-1,c.complaint_id]);
        }

      escalatedComplaints.push({ complaint_id: c.complaint_id });
      queueAuditEvent({
        complaintId: c.complaint_id,
        action: "SLA_ESCALATION_TRIGGERED",
        actor: "SYSTEM_ESCALATION_JOB",
        oldValue: previousPriority,
        newValue: c.priority === "Low" ? "Medium" : "High",
        department: String(c.dept_id),
        metadataHash: `${c.complaint_id}:${previousPriority}->${c.priority === "Low" ? "Medium" : "High"}`,
        timestamp: new Date(),
      });
      queueComplaintVerificationSync(c.complaint_id).catch((error) => {
        console.error("ICP verification sync failed after escalation:", error.message);
      });
      }
      else{
        if (c.staff_id) {
          await pool.query(`
            UPDATE users
            SET points = GREATEST(COALESCE(points, 0) - 1, 0)
            WHERE user_id = $1;
          `,[c.staff_id]);
        }

        await pool.query(`
            UPDATE complaints
            SET status='New',
              updated_at=NOW(),
              staff_id=NULL,
              assigned_to=NULL,
              sla_deadline=NOW() + $1::interval,
              temp_points=$2
              WHERE complaint_id=$3;
          `,[newSlaDeadline,3,c.complaint_id]);

        escalatedComplaints.push({ complaint_id: c.complaint_id});
        queueAuditEvent({
          complaintId: c.complaint_id,
          action: "SLA_ESCALATION_TRIGGERED",
          actor: "SYSTEM_ESCALATION_JOB",
          oldValue: previousStatus,
          newValue: "New",
          department: String(c.dept_id),
          metadataHash: `${c.complaint_id}:${previousPriority}:RESET`,
          timestamp: new Date(),
        });
        queueComplaintVerificationSync(c.complaint_id).catch((error) => {
          console.error("ICP verification sync failed after escalation reset:", error.message);
        });

        notifyAdminForManualReassignment(c.complaint_id);
      }
    }

    return escalatedComplaints;
  } catch (err) {
    console.error("❌ Escalation process failed:", err.message);
    throw err;
  }
};

export const fetchHeatmapData = async () => {
  const query = `
    SELECT 
      complaint_id, 
      ST_Y(geolocation::geometry) AS latitude,
      ST_X(geolocation::geometry) AS longitude
    FROM complaints
    WHERE geolocation IS NOT NULL;
  `;
  const { rows } = await pool.query(query);
  return rows;
};
