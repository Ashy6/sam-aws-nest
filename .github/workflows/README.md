## Deploy backend (prod)

1. Set GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DATABASE_URL`
   - `DB_SECURITY_GROUP_ID` (optional, overrides auto-detection)
   - `LAMBDA_SECURITY_GROUP_ID` (optional, use existing lambda SG)

2. Run `Deploy Backend (prod)` from Actions → workflow dispatch.
