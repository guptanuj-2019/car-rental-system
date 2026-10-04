# Car Rental Management System

## Run locally

1. Install the backend dependencies: `cd backend` then `npm install`.
2. Copy `backend/.env.example` to `backend/.env`, then set `MONGO_URI` and a private `JWT_SECRET`.
3. Set the email or Twilio variables if you want to test password-reset OTP delivery.
4. Start the API from `backend` with `npm start` (or `npm run dev`).
5. In a second terminal, install frontend dependencies from `frontend` and copy `frontend/.env.example` to `frontend/.env.local`.
6. Start the frontend from `frontend` with `npm run dev`.

The frontend uses `VITE_API_URL` as the API base URL, including the `/api` suffix. If it is omitted, local development uses `http://localhost:5000/api`.

## Deploy

Deploy the backend and frontend as separate services:

1. Create a backend web service from this repository with `backend` as its root directory. Use `npm install` for the build command and `npm start` for the start command.
2. Add the backend environment variables from `backend/.env.example` in the hosting provider's secret/environment settings. Set `MONGO_URI` to a reachable MongoDB database and use a unique, strong `JWT_SECRET`. Do not commit real `.env` files or credentials.
3. Configure email OTP delivery with an SMTP account. For Gmail, use an app password rather than the account's normal password. To enable mobile OTPs, set all three Twilio variables; Twilio trial accounts can only text verified recipient numbers.
4. Deploy the frontend as a static Vite site with `frontend` as its root directory, `npm install` as the install/build preparation command, `npm run build` as the build command, and `dist` as the publish directory.
5. Set the frontend build environment variable `VITE_API_URL` to the deployed backend URL ending in `/api` (for example, `https://your-api.example.com/api`), then redeploy the frontend.

The reset form sends the OTP through the channel matching the registered email address or mobile number. A successful response is returned only after the configured provider accepts the send request; missing or failing provider configuration is reported instead of showing a false success.
