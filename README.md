# PocketCourt — Mobile-First Multiplayer Courtroom Simulator

PocketCourt is a real-time 3-player people's court game built for resolving casual, everyday misunderstandings between friends and flatmates (e.g. shared Netflix lockouts, stolen midnight leftovers, trip expense splits) in under 5 minutes.

---

## 🏛️ Included Projects & Deliverables

### 1. Web Simulation Sandbox (`index.html`)
- Standalone single-file prototype with native Web Audio synthesis for gavel strikes, objections, evidence stamps, and chat notifications.
- Visual screen-shake and dramatic red-flash effects on objections.
- Interactive Evidence Lightbox with zoom inspection and Admit / Dismiss actions.
- Role switcher (Plaintiff, Defendant, Judge), bot auto-reply simulator, and WhatsApp summons generator.
- Double-click `index.html` in your browser to test immediately with zero build steps!

### 2. React Native (Expo) Mobile App (`pocketcourt_mobile_starter/`)
A fully modular mobile application built on Expo SDK 51 and Firebase Realtime Database:
- `App.js`: State manager with real-time sync and built-in offline demo fallback.
- `src/components/CourtHeader.js`: Room code badge, 3/3 presence indicators with HERE/AFK status, mutual judge approval handshake, and honor scores.
- `src/components/RecessBanner.js`: High-visibility court pause banner when any player is AFK.
- `src/components/ObjectionBanner.js`: Real-time objection alert with Judge Sustain / Overrule buttons.
- `src/components/WitnessBanner.js`: 60-second temporary witness pass with live countdown and testimony drop.
- `src/components/CourtChatTab.js`: Message stream, Judge mic floor control (`BOTH`, `PLAINTIFF`, `DEFENDANT`), spectator jury polling, and action chips.
- `src/components/EvidenceLockerTab.js`: Official evidence catalog with rubber-stamp badges (`ADMITTED`, `DISMISSED`, `PENDING`), exhibit citation in chat, and image previews.
- `src/components/VerdictTab.js`: Winner selector, reasoning/penalty inputs, final gavel strike lock, gold-bordered certificate, and one-tap formatted receipt export.
- `src/components/LobbyTab.js`: Room joiner, preset dispute loader (Netflix, Biryani, Goa Cab), and custom dispute generator.
- `src/components/BottomTabBar.js`: Clean 4-tab mobile navigation bar.
- `src/courtroomService.js`: Firebase Realtime Database and Cloud Storage service layer.
- `database.rules.json`: Enforces role-based permissions and permanent read-only lock once `verdict.isFinal == true`.

---

## 🚀 Quick Start (Expo Mobile App)

1. **Install dependencies** (if not already installed):
   ```bash
   cd pocketcourt_mobile_starter
   npm install
   ```

2. **Configure Firebase**:
   - Create a free project at [Firebase Console](https://console.firebase.google.com).
   - Enable **Anonymous Authentication**, **Realtime Database**, and **Cloud Storage**.
   - Paste your project keys into `src/firebaseConfig.js`.
   - Deploy `database.rules.json` into the Firebase Realtime Database Rules tab.

3. **Start Expo**:
   ```bash
   npx expo start
   ```
   Scan the QR code with **Expo Go** on Android or iOS.
