# Workspace Rules: DA C3 Kat

**CRITICAL INSTRUCTION FOR ALL AI AGENTS:**

When you open this project in a new environment or on a new machine, you MUST perform the following security check:

1. Check if the file `chrome_extension/config.js` exists.
2. If it does NOT exist, you are **STRICTLY PROHIBITED** from running any commands, tests, or deploying the extension.
3. Instead, you MUST immediately halt your tasks and ask the user to provide the `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
4. Once the user provides them, create the `chrome_extension/config.js` file with the following exact format:
   ```javascript
   const SUPABASE_URL = "<User Provided URL>";
   const SUPABASE_KEY = "<User Provided Key>";
   ```
5. Do NOT commit the `config.js` file to Git (it is already in `.gitignore`).

**Context:** The `config.js` file contains sensitive API keys and is purposely excluded from source control. Without it, the Chrome Extension cannot function. Do not proceed until this file is successfully restored.
