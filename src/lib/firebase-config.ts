/**
 * PASTE YOUR FIREBASE WEB-APP SETTINGS HERE.
 *
 * Firebase console → Project settings (gear icon) → General → "Your apps" → Web app (</>) → "SDK setup and configuration" → Config.
 *
 * These values are NOT secrets. They are meant to be public inside a website, so it is fine to
 * commit them to GitHub. Your data is protected by the rules in firestore.rules, not by hiding this file.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyDcx-VgI-vFV-UNTOQigJ_6wgcigtY1SNc',
  authDomain: 'anandham-store.firebaseapp.com',
  projectId: 'anandham-store',
  appId: '1:437300769601:web:177eac7f4ee38ef4ac27c0',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  value => value.trim() !== '' && !value.startsWith('PASTE_'),
);
