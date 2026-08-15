const cron = require('node-cron');
const db = require('../db');

// Sets is_active = false on events whose end (or, if no end time, start) has
// passed. Runs on startup and then hourly.
function archivePastEvents() {
  const result = db
    .prepare(
      `UPDATE events
       SET is_active = 0
       WHERE is_active = 1
         AND datetime(COALESCE(end_datetime, start_datetime)) < datetime('now')`
    )
    .run();
  if (result.changes > 0) {
    console.log(`[archiveEvents] deactivated ${result.changes} past event(s)`);
  }
  return result.changes;
}

function startArchiveJob() {
  archivePastEvents();
  cron.schedule('0 * * * *', archivePastEvents); // hourly
}

module.exports = { startArchiveJob, archivePastEvents };
