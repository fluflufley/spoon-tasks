# Spoon Tasks – setup (about 15 minutes, once)

## 1. Create the free cloud database
1. Go to https://console.firebase.google.com and sign in with a Google account.
2. **Add project** → name it (e.g. "spoon-tasks"). You can turn Google Analytics off.
3. **Build → Firestore Database → Create database**
   ⚠️ Make sure it says **Firestore Database**, NOT "Realtime Database". Realtime Database uses JSON rules and will not work with this app. (If you already created one by mistake, you can ignore it and just create Firestore too.) → choose a location near you → start in **production mode**.
4. In Firestore, open the **Rules** tab, replace everything with the text below, and press **Publish**. (Firestore rules are plain text in Google's rules language, not JSON, so you should see `rules_version` and `service cloud.firestore` in the editor already.)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
5. **Build → Authentication → Get started → Sign-in method**:
   - **Google → Enable** → choose your email as the "support email" → Save.
   - (Optional) **Email/Password → Enable → Save**, if you also want email sign-in.
6. **Authentication → Settings → Authorized domains → Add domain** and add the address where you host the app (for example `something.netlify.app`, without https://). Google sign-in will not work until this is done.

## 2. Connect the app to it
1. Project settings (gear icon) → **General** → scroll to **Your apps** → click the **</>** (Web) icon → register the app (skip hosting).
2. Copy the values shown in `firebaseConfig` (apiKey, authDomain, projectId, appId) into **firebase-config.js**, replacing the PASTE_… placeholders.
   (These values are not secret. The rules above are what protect your data.)

## 3. Put the app online (needs https)
Easiest: go to https://app.netlify.com/drop and drag this whole folder onto the page. You get a link like https://something.netlify.app.
(GitHub Pages or any static host also works.)

## 4. Install it on your phone
- **iPhone:** open the link in Safari → Share → **Add to Home Screen**.
- **Android:** open the link in Chrome → ⋮ menu → **Install app**.
It now opens full-screen from its own icon, with no browser bars.

## 5. First use
Open the app and tap **Continue with Google** (or use email and password). Sign in the same way on any other device to see the same tasks. Tasks you added before signing in are uploaded the first time.

If you edit the files later, change `CACHE = "spoon-tasks-v1"` in sw.js to a new name (v2, v3…) so phones pick up the update.

---

# Reminders (optional, one-time setup, about 10 minutes)

Reminders arrive as phone notifications, and your Garmin watch mirrors them while it is connected to the phone.
A scheduled job on GitHub checks every 5 minutes (GitHub can start it a few minutes late) and sends the notifications.

## A. Get the Web Push key
1. Firebase console → gear icon → **Project settings** → **Cloud Messaging** tab.
2. Under **Web configuration → Web Push certificates**, click **Generate key pair**.
3. Copy the key pair (a long text).
4. On GitHub, open `firebase-config.js` → pencil icon → replace `PASTE_YOUR_VAPID_KEY` with the key (keep the quotes) → **Commit changes**.
   (This key is public and safe to store in the repository.)
5. On the same Cloud Messaging tab, check that **Firebase Cloud Messaging API (V1)** says **Enabled**.

## B. Give the scheduled job access (this key IS secret)
1. Firebase console → **Project settings** → **Service accounts** tab → **Generate new private key** → a .json file downloads.
2. On GitHub, open the repository → **Settings → Secrets and variables → Actions → New repository secret**.
3. Name: `FIREBASE_SERVICE_ACCOUNT`. Value: open the downloaded file and paste its **entire contents**. Click **Add secret**.
4. Delete the downloaded .json file from your computer. Never put it in the repository or share it.
5. Open the **Actions** tab, choose **Send task reminders**, and click **Run workflow** once. It should finish with a green check.

## C. Turn it on, on your phone
1. Open the app (v19 or later) and sign in.
2. ⚙ **Customize → Reminders → Enable notifications on this device** → Allow.
3. Tap **Send a test** and check that your phone and watch both show it.
4. Garmin Connect app → notification settings → make sure notifications are allowed for the **Spoon Tasks** app (or for Chrome if it is not listed). Menu names vary by app version.
5. Android → Settings → Apps → Spoon Tasks → Battery → **Unrestricted**, so notifications are not delayed.

## Notes
- GitHub turns off scheduled jobs on a repository with no activity for 60 days. If reminders stop, open the Actions tab and enable the workflow again.
- A reminder is only sent once per reminder time, and never for tasks marked Done or more than a day late.
