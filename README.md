# LIFEHELP — Part 1 (Foundation)

**One Community. One Platform. Unlimited Help.**

Part 1 contains the app shell: splash screen, real Supabase login/registration, dashboard,
bottom navigation, Emergency screen (direct 112 call), light/dark theme, English/Tamil, toasts and
reusable components. Other modules show an honest "Coming soon" screen until their stage is built.

## Phone-only setup (no computer)

### A. Create the Supabase project (Authentication only is needed in Part 1)
1. Go to supabase.com, create a project.
2. Project Settings > API: copy **Project URL** and the **anon public** key. (Never use `service_role`.)
3. Authentication > Providers > Email: keep Email enabled.
   For quick testing you may turn OFF "Confirm email"; otherwise users must confirm by email before signing in.
4. Authentication > URL Configuration: set Site URL to your GitHub Pages URL
   (`https://<username>.github.io/<repo>/`) once you have it.

### B. Upload to GitHub
1. Create a repository (e.g. `LIFEHELP`) on github.com.
2. Unzip the project in your phone's Files app, then upload the files with the GitHub web upload
   (use "Desktop site" in Chrome). Make sure `.github/workflows/deploy.yml` is included.
   Tip: if hidden folders are not selectable, create `.github/workflows/deploy.yml` with
   "Add file > Create new file" and paste the contents.
3. Repo Settings > Secrets and variables > Actions > New repository secret. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Repo Settings > Pages > Source: **GitHub Actions**.
5. Push/commit to `main`. Open the Actions tab; when "Deploy LIFEHELP to GitHub Pages" is green, open the Pages URL.

### Alternative: run in GitHub Codespaces (browser)
Open the repo > Code > Codespaces > Create. In the terminal:
```
cp .env.example .env     # then edit .env with your values
npm install
npm run dev
```
Open the forwarded port 5173.

## Computer commands (if you ever have one)
```
npm install
npm run dev       # development server
npm run build     # production build in dist/
npm run preview   # preview the build
```

## Environment variables (only these two)
See `.env.example`.

## How to test Part 1
1. Splash appears ~2s, then Login.
2. Register: submit empty (see validation), weak password, mismatched passwords, no consent; then a valid account.
3. After login you land on Home; test search ("blood"), module cards (Coming soon), Emergency tab.
4. "Call 112" opens your phone dialer (tel:112); nothing is dialled automatically.
5. Profile: switch Light/Dark and English/தமிழ், then Sign out.
6. Reload the page: your session and theme/language persist.
