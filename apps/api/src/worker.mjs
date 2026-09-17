import { pool, transaction } from "./db.mjs";
export async function deliverNotifications() {
  const client = await pool.connect();
  let job;
  try {
    await client.query("BEGIN");
    job = (
      await client.query(
        "SELECT * FROM notification_jobs WHERE delivered_at IS NULL AND dead_at IS NULL AND available_at<=now() ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT 1",
      )
    ).rows[0];
    if (job) {
      await client.query(
        "INSERT INTO notifications(user_id,reservation_id,message) VALUES($1,$2,$3)",
        [job.user_id, job.reservation_id, job.message],
      );
      await client.query(
        "UPDATE notification_jobs SET delivered_at=now(),attempts=attempts+1 WHERE id=$1",
        [job.id],
      );
    }
    await client.query("COMMIT");
    return Boolean(job);
  } catch (error) {
    await client.query("ROLLBACK");
    if (job)
      await transaction((db) =>
        db.query(
          "UPDATE notification_jobs SET attempts=attempts+1,available_at=now()+interval '1 minute'*power(2,least(attempts,8)),dead_at=CASE WHEN attempts>=7 THEN now() ELSE NULL END WHERE id=$1 AND delivered_at IS NULL",
          [job.id],
        ),
      );
    throw error;
  } finally {
    client.release();
  }
}
