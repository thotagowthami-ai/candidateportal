# CandidatePortal Postman Pack

This folder contains Postman files for post-deployment validation.

## Files

- `CandidatePortal.postman_collection.json`
- `CandidatePortal.postman_environment.json`

## How to run

1. Import both files into Postman.
2. Select `CandidatePortal - Deployed Environment`.
3. Update `base_url` to your deployed backend URL.
4. Set valid `auth_email`, `auth_password`, and `resume_file_path`.
5. If your backend paths differ, adjust `*_path` variables in the environment.
6. Run folders in order:
   - `00 - Smoke`
   - `01 - Auth`
   - `02 - Jobs`
   - `03 - Resumes`
   - `04 - Applications`

## Continue With Google

1. Run `01 - Auth -> Continue With Google -> Google OAuth - Start`.
2. If response contains `location` header, it is stored in `google_redirect_url`.
3. Complete Google sign-in in browser and copy `code` (and `state` if required) from callback URL.
4. Set `google_auth_code` and `google_state` in environment.
5. Run `Google OAuth - Callback (code exchange)` to validate backend callback/token flow.

## Notes

- Login requests include both JSON and OAuth2-password-form variants because deployments can differ.
- Google OAuth endpoints are configurable via `auth_google_start_path` and `auth_google_callback_path`.
- Access token, IDs, and other dynamic values are automatically captured from responses.
- If a request fails with `404`, update the corresponding `*_path` variable.

## GitHub Post-Deployment Testing

A GitHub Actions workflow is available at:

- `.github/workflows/backend-postdeploy-smoke.yml`

It runs Newman against this collection after `Update Build Trigger TXT` completes successfully, and also supports manual run via `workflow_dispatch`.

Set these repository secrets for CI:

- `BACKEND_BASE_URL` (example: `https://cportal-production.up.railway.app`)
- `POSTMAN_AUTH_EMAIL` (optional; enables auth folder tests)
- `POSTMAN_AUTH_PASSWORD` (optional; enables auth folder tests)
