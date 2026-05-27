import cron from "node-cron";
import { escalateComplaintsByCategory } from "../services/complaint.service.js";
import { notifyOverdueReminder } from "../services/notification.service.js";

/**
 * 🔁 Scheduled Job: Complaint Escalation Check
 * Runs every 6 hours starting from midnight
 * Checks all complaints whose SLA deadline has passed and status != RESOLVED
 * Updates their status to "ESCALATED" and optionally reassigns staff
 */
cron.schedule("0 */6 * * *", async () => {
  console.log("⏰ Running scheduled SLA escalation check...");

  try {
    const escalated = await escalateComplaintsByCategory();

    if (escalated.length > 0) {
      console.log(`⚡ Auto-escalated ${escalated.length} complaints:`);
      escalated.forEach((c) =>
        console.log(` - [${c.complaint_id}] ${c.title} (${c.category})`)
      );
    } else {
      console.log("✅ No complaints needed escalation today");
    }
  } catch (err) {
    console.error("❌ Error during escalation job:", err.message);
  }
});


cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running daily SLA reminder emails...");
  await notifyOverdueReminder();
})
