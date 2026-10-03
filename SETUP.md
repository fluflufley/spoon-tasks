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
