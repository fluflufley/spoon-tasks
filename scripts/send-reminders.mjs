// Runs on a schedule (see .github/workflows/reminders.yml).
// For every user: find tasks whose reminder time has arrived and send a push notification to their devices.
import admin from "firebase-admin";
import { dueTasks, pruneSent, messageFor, DEAD_TOKEN_CODES } from "./lib.mjs";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw || !raw.trim()) {
  console.log("FIREBASE_SERVICE_ACCOUNT is not set yet, so reminders are not configured. Nothing to do.");
  process.exit(0);
}
let cred;
try { cred = JSON.parse(raw); } catch (e) { console.error("FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the whole downloaded key file."); process.exit(1); }

admin.initializeApp({ credential: admin.credential.cert(cred) });
const db = admin.firestore();
const dry = process.env.DRY_RUN === "1";
const now = Date.now();
let sentCount = 0;

const users = await db.collection("users").listDocuments();
for (const u of users) {
  const data = u.collection("data");
  const [tSnap, dSnap, rSnap] = await Promise.all([data.doc("tasks").get(), data.doc("devices").get(), data.doc("reminders").get()]);
  const tasks = tSnap.exists ? tSnap.data().tasks : [];
  const sent = rSnap.exists ? (rSnap.data().sent || {}) : {};
  const tokens = dSnap.exists ? (dSnap.data().tokens || []) : [];
  const due = dueTasks(tasks, sent, now);
  const newSent = pruneSent(tasks, sent);

  if (due.length && !tokens.length) {
    console.log(`User ${u.id}: ${due.length} reminder(s) due but no device has notifications enabled.`);
  }
  const dead = new Set();
  if (tokens.length) {
    for (const t of due) {
      const m = messageFor(t);
      if (dry) { console.log(`[dry run] would send "${t.name}" to ${tokens.length} device(s)`); continue; }
      const res = await admin.messaging().sendEachForMulticast({
        tokens,
        data: { title: m.title, body: m.body, tag: m.tag },
        android: { priority: "high" },
        webpush: { headers: { Urgency: "high", TTL: "7200" } }
      });
      let ok = 0;
      res.responses.forEach((r, i) => {
        if (r.success) ok++;
        else if (r.error && DEAD_TOKEN_CODES.includes(r.error.code)) dead.add(tokens[i]);
        else console.log(`Send error for "${t.name}":`, r.error && r.error.code);
      });
      if (ok > 0) { newSent[String(t.id)] = t.remindAt; sentCount++; console.log(`Sent "${t.name}" to ${ok} device(s).`); }
    }
  }
  if (!dry) {
    if (JSON.stringify(newSent) !== JSON.stringify(sent)) await data.doc("reminders").set({ sent: newSent });
    if (dead.size) {
      await data.doc("devices").set({ tokens: tokens.filter(x => !dead.has(x)) }, { merge: true });
      console.log(`Removed ${dead.size} expired device token(s).`);
    }
  }
}
console.log(`Done. ${sentCount} reminder(s) sent.`);
