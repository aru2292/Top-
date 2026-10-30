# TOP Discord Bot

TOP is a modular Discord bot starter with security, moderation, automod, welcome/logging, ticket, giveaway, utility and music features.

## Important reality check
- This is a ready-to-deploy **starter release**, not 300,000 separate modules.
- Anti-Nuke is best-effort protection, not a guarantee. Discord audit logs can arrive late; role hierarchy and permissions matter. Test it in a private server first.
- Music extraction sources can change or block automated playback. Discord Player v6 extractors are included, but no third-party music source can be guaranteed forever.
- Railway's filesystem is ephemeral by default. Attach a Railway Volume and set `DATA_DIR=/data` if you want JSON data to survive redeploys.

## 1. Create the Discord application
1. Open https://discord.com/developers/applications
2. Create an application named **TOP**.
3. Open **Bot** and create/reset the bot token.
4. Enable **SERVER MEMBERS INTENT** and **MESSAGE CONTENT INTENT**. (Presence intent is not required.)
5. Copy the bot token. Never share it or upload it to GitHub.
6. In OAuth2 > General, copy the Application ID (`CLIENT_ID`).

## 2. Invite TOP
In OAuth2 > URL Generator select:
- Scopes: `bot`, `applications.commands`
- Bot permissions: View Channels, Send Messages, Embed Links, Read Message History, Manage Messages, Manage Channels, Manage Roles (only if you later add role automation), Kick Members, Ban Members, Moderate Members, View Audit Log, Connect, Speak, Use Voice Activity.

Open the generated URL and invite TOP to your test server. Keep TOP's role above roles it needs to moderate. Do not give Administrator unless you understand the risk.

## 3. Upload to GitHub
1. Extract the ZIP.
2. Create a new GitHub repository.
3. Upload the **contents** of this folder (not an extra nested folder if you want a clean repo).
4. Do not upload `.env`, tokens, or `node_modules`.

## 4. Deploy on Railway
1. Create a Railway project and deploy from your GitHub repository.
2. Railway should detect `package.json` and run `npm start`.
3. In Railway > Variables add:
   - `DISCORD_TOKEN` = your bot token
   - `CLIENT_ID` = your Application ID
   - `PREFIX` = `.`
   - `OWNER_IDS` = your Discord user ID (optional; comma-separated)
   - `DATA_DIR` = `/data` if you attach a Railway Volume at `/data`
4. Add a Railway Volume mounted at `/data` to persist `top-data.json`. Without a volume, saved settings may reset on redeploy/restart.
5. Check deployment logs for `TOP is online as ...`.

## 5. Slash commands
TOP automatically registers its included slash commands when it starts. For faster testing, set `GUILD_ID` in Railway Variables to your test server ID; remove it to register globally (global propagation can take time).

## Commands
Prefix defaults to `.`. Run `.help`.

Security:
- `.antinuke on|off`
- `.antinuke threshold 3`
- `.whitelist add @user`
- `.whitelist remove @user`
- `.automod on|off`

Moderation:
- `.ban @user [reason]`
- `.kick @user [reason]`
- `.timeout @user <minutes>`
- `.clear <1-100>`
- `.warn @user <reason>`
- `.warnings @user`
- `.lock`, `.unlock`, `.slowmode <seconds>`

Music:
- `.play <song or URL>`, `.skip`, `.stop`, `.pause`, `.resume`, `.queue`, `.volume <1-100>`
- Slash: `/play`, `/skip`, `/stop`, `/queue`

Server/community:
- `.setlog #channel`, `.setwelcome #channel`, `.serverinfo`
- `.ticket`, `.poll <question>`, `.giveaway <minutes> <prize>`
- `.8ball <question>`, `.coinflip`, `.say <text>`

## Safety notes
- Test Anti-Nuke with a second test account and low-risk actions in a private server.
- The current Anti-Nuke response attempts to ban or kick an executor after the configured threshold. If TOP lacks permissions or role position, it logs the alert but cannot act.
- Keep an owner account in the whitelist. Avoid whitelisting ordinary moderators unless required.
- Never paste bot tokens into chat, screenshots, public repositories, or support servers.
