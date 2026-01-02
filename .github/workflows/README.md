## Deploy backend (prod)

1. Set GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DATABASE_URL`
   - `DB_SECURITY_GROUP_ID` (optional, overrides auto-detection)
   - `LAMBDA_SECURITY_GROUP_ID` (optional, use existing lambda SG)

2. Run `Deploy Backend (prod)` from Actions → workflow dispatch.

Notes:
- `DATABASE_URL` should point to a DB name that exists or can be created by migrations, e.g. `...:5432/sam_aws_nest?schema=public`.
- If you set `LAMBDA_SECURITY_GROUP_ID`, the template reuses that SG for Lambda VPC attachment.
