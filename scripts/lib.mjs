// Pure logic for choosing which reminders to send (no network, easy to test).

export const MAX_AGE_MS = 24 * 3600 * 1000; // never send a reminder that is more than a day late

// Returns the tasks whose reminder time has arrived and that have not been notified for that exact time.
export function dueTasks(tasks, sent, now = Date.now()) {
  if (!Array.isArray(tasks)) return [];
  sent = sent || {};
  return tasks.filter(t => {
    if (!t || !t.remindAt || t.status === "Done") return false;
    const at = Date.parse(t.remindAt);
    if (isNaN(at) || at > now || now - at > MAX_AGE_MS) return false;
    return sent[String(t.id)] !== t.remindAt;
  });
}

// Keeps only the "already sent" markers that still match a task's current reminder time.
export function pruneSent(tasks, sent) {
  const out = {};
  for (const t of Array.isArray(tasks) ? tasks : []) {
    if (t && t.remindAt && sent && sent[String(t.id)] === t.remindAt) out[String(t.id)] = t.remindAt;
  }
  return out;
}

export function messageFor(t) {
  const bits = [t.category, `priority ${t.priority}`, `${t.spoons} spoon${t.spoons === 1 ? "" : "s"}`].filter(x => x !== undefined && x !== "");
  return { title: "\u{1F944} Reminder", body: `${t.name}\n${bits.join(" · ")}`, tag: `task-${t.id}` };
}

export const DEAD_TOKEN_CODES = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument"
];
