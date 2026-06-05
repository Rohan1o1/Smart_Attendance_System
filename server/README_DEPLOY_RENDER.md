Deployment checklist for Render

1) Environment variables to set on Render:
   - MONGODB_URI (required)
   - JWT_SECRET (required)
   - NODE_ENV=production
   - PORT (Render sets automatically; leave blank)
   - CLIENT_URL (your client URL)
   - ADMIN_EMAIL / ADMIN_PASSWORD (optional)
   - S3_URL or FACE_MODELS_URL (if you host face models externally)
   - EMAIL_PASSWORD, REDIS_PASSWORD (if used)

2) MongoDB Atlas:
   - Ensure the connection string in `MONGODB_URI` points to the expected database name (attendance_system).
   - Add Render's egress IPs to Atlas network access or temporarily allow 0.0.0.0/0 while testing.

3) Native libraries & model files:
   - `canvas` may require system libraries not available by default; consider deploying with Docker or remove/replace canvas usage.
   - Face-api model files must be present at `server/models` or loaded from a URL; ensure they are available in the deployed environment.

4) Start command & static client:
   - `start` script is `node app.js` which is fine for Render.
   - If you want to serve the client from the same service, build the client and ensure `app.js` serves the `client/dist` folder.

5) Debugging:
   - Check Render service logs for startup errors (missing env vars, connection errors, model load errors, native build failures).
   - Verify `config.validateConfig` isn't exiting due to missing `JWT_SECRET` or `MONGODB_URI`.

Notes:
- Consider using Docker on Render to control system libraries if canvas/sharp cause build-time errors.
- I did not change any existing project files; this file is an added guide to help your deployment. 
