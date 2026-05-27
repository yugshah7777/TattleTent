import pool from '../db/db.js';

export const saveFeedbackToDB = async ({ complaint_id, rating, comment }) => {
  // const newFeedback = {
  //   id: feedbacks.length + 1,
  //   complaint_id,
  //   rating,
  //   comment,
  //   created_at: new Date().toISOString(),
  // };

  // feedbacks.push(newFeedback);
  // return newFeedback;
  try {
    const result = await pool.query(
      `SELECT user_id, staff_id FROM complaints WHERE complaint_id = $1`,
      [complaint_id]
    );

    if (result.rows.length === 0) {
      throw new Error(`No complaint found with ID: ${complaint_id}`);
    }

    const { user_id, staff_id } = result.rows[0];

    const feedback = await pool.query(
      `INSERT INTO feedbacks 
        (complaint_id, user_id, staff_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING feedback_id`,
      [complaint_id, user_id, staff_id, rating, comment]
    );

    // 3️⃣ Return the inserted complaint
    return feedback.rows[0];
  } catch (err) {
    console.error("❌ Error saving feedback:", err.message);
    throw err;
  }
};

export const getFeedbacksFromDB = async () => {
  const result = await pool.query(
    `SELECT f.feedback_id, f.rating, f.comment, f.user_id, u.name AS name
     FROM feedbacks f
     JOIN users u ON f.user_id = u.user_id`
  );
  return result.rows;
};

export const getFeedbacksForComplaintFromDB = async (complaint_id) => {
  const result = await pool.query(
    `SELECT f.feedback_id, f.rating, f.comment, f.user_id, u.name AS name
     FROM feedbacks f
     JOIN users u ON f.user_id = u.user_id
     WHERE f.complaint_id = $1`,
    [complaint_id]
  );
  return result.rows;
};
