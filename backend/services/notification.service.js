import pool from "../db/db.js";
import sendEmail from "../utils/sendEmail.js";
import { EMAIL_BRAND_NAME, getEmailFooter } from "../utils/email.config.js";


/**
 * 🔔 Notify staff and citizen when a complaint's status is changed.
 */
export const notifyStatusChange = async (complaintId) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.complaint_id, c.title, c.category, c.priority,c.status,
        u1.name AS citizen_name, u1.email AS citizen_email
      FROM complaints c
      JOIN users u1 ON c.user_id = u1.user_id
      WHERE c.complaint_id = $1
    `, [complaintId]);

    if (result.rowCount === 0) return;
    const c = result.rows[0];

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const FEEDBACK_URL = `${frontendUrl}/feedback-page?complaintId=${c.complaint_id}`;
    let feedbackContent = "";

      // Check if the status is resolved to include the special link
    if (c.status === 'Resolved') {
      feedbackContent = `
        <p>Your complaint has been resolved. Please take a moment to provide feedback on your experience:</p>
        <p style="text-align: center; margin: 20px 0;">
            <a href="${FEEDBACK_URL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">
                Leave Feedback Now
            </a>
        </p>
      `;
    }

    // 🧠 Email to citizen
    await sendEmail({
        email: c.citizen_email,
        subject: `Complaint Update #${c.complaint_id} — ${EMAIL_BRAND_NAME}`,
        html: `
            <h2>Complaint Status Update</h2>
            <p>Hello,</p>
            <p>Your complaint status has been updated.</p>
            
            <p><b>Title:</b> ${c.title}</p>
            <p><b>Complaint ID:</b> #${c.complaint_id}</p>
            <p><b>New Status:</b> <span style="font-weight: bold; color: #007bff;">${c.status}</span></p>

            <!-- Conditional content inserted here -->
            ${feedbackContent}
            <!-- End conditional content -->

            <p>You can view full details through your ${EMAIL_BRAND_NAME} dashboard.</p>
            ${getEmailFooter()}
        `,
    });

    

    console.log(`📩 Status notification sent for complaint ${c.complaint_id}`);
  } catch (err) {
    console.error("❌ Error sending Status change notification:", err.message);
  }
};


/**
 * ⏰ Send reminder to staff if complaint is close to SLA deadline (e.g., within 1 day).
 */
export const notifyOverdueReminder = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        c.complaint_id, c.title, c.category, c.priority, c.sla_deadline,
        u.email AS staff_email, u.name AS staff_name
      FROM complaints c
      JOIN users u ON c.staff_id = u.user_id
      WHERE c.status IN ('New', 'IN_PROGRESS')
      AND c.sla_deadline IS NOT NULL
      AND c.sla_deadline > NOW()
      AND c.sla_deadline < NOW() + INTERVAL '2 day';
    `);

    if (result.rowCount === 0) {
      console.log("✅ No upcoming SLA deadlines in next 2 days.");
      return;
    }

    for (const c of result.rows) {
      const hoursLeft = Math.round(
        (new Date(c.sla_deadline) - new Date()) / (1000 * 60 * 60)
      );

      await sendEmail({
        email: c.staff_email,
        subject: `SLA Reminder: Complaint #${c.complaint_id} — ${EMAIL_BRAND_NAME}`,
        html: `
          <h2>SLA Deadline Approaching</h2>
          <p>Complaint "<b>${c.title}</b>" assigned to you is due in <b>${hoursLeft} hours</b>.</p>
          <p><b>Category:</b> ${c.category}</p>
          <p><b>Priority:</b> ${c.priority}</p>
          <p><b>Deadline:</b> ${new Date(c.sla_deadline).toLocaleString()}</p>
          <br/>
          <p>Please resolve it before the SLA deadline to avoid escalation.</p>
          ${getEmailFooter()}
        `,
      });

      console.log(`📧 Reminder sent to ${c.staff_email} for complaint ${c.complaint_id}`);
    }
  } catch (err) {
    console.error("❌ Error sending SLA reminders:", err.message);
  }
};

export const notifyAdminForManualReassignment = async (complaintId) => {
  const admins = await pool.query(`SELECT email FROM users WHERE role = 'Ringmaster'`);
  const emails = admins.rows.map(a => a.email);

  const complaint = await pool.query(`
    SELECT complaint_id, title, priority
    FROM complaints
    WHERE complaint_id = $1;
  `, [complaintId]);

  for (const email of emails) {
    await sendEmail({
      email,
      subject: `Escalation Notice: Complaint #${complaintId} — ${EMAIL_BRAND_NAME}`,
      html: `
        <h2>Manual Reassignment Required</h2>
        <p>Complaint "<b>${complaint.rows[0].title}</b>" (Priority: ${complaint.rows[0].priority}) has reached its maximum escalation limit.</p>
        <p>Please review and assign a new staff member manually.</p>
        ${getEmailFooter()}
      `,
    });
  }
};
