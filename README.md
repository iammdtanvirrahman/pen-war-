# Pen Fighter (React + Three.js + Cannon-es)

A high-stakes 3D tabletop duel game built with React, TypeScript, Vite, Tailwind CSS, Three.js, and Cannon-es.

## Features

- Three.js tabletop rendering and Cannon-es rigid-body physics.
- Local pass-and-play and AI gameplay.
- Touch/click-and-drag aiming, power feedback, and trajectory guide.
- Mobile-oriented layout and landscape guard.

## Web development

```bash
npm install
npm run dev
```

Create a production web build:

```bash
npm run build
```

## Android app (Capacitor)

The `android-app` branch includes Capacitor configuration and a GitHub Actions workflow that builds a debug APK.

### Build an APK in GitHub Actions

1. Open the repository's **Actions** tab.
2. Select **Build Pen War Android APK**.
3. Choose **Run workflow** on the `android-app` branch, or push a change to that branch.
4. Open the completed workflow run and download the `pen-war-android-debug-apk` artifact.
5. Extract the ZIP and install `app-debug.apk` on an Android device. You may need to allow installs from that source.

The workflow creates the Android wrapper from the current web build, sets the activity to landscape, and uploads a debug APK. A debug APK is for testing, not a Play Store release.

### Build locally (requires Android Studio and Android SDK)

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio, wait for Gradle sync, then choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

If `android/` already exists, do not run `npx cap add android` again; use `npx cap sync android`.

## Before publishing

Test the APK on real Android devices for 3D frame rate, touch input, model/texture loading, audio, app resume/pause, and landscape behavior. The automated workflow produces a test APK; it does not certify performance or create a signed Play Store AAB. The Google Play release needs a release signing key and a separate signed bundle build.
