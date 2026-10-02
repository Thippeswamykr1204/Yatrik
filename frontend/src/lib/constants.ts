export const APP_NAME = "Yatrik";
export const APP_TAGLINE = "Less planning. More being there.";
// Empty means same-origin /api. Never put a Gemini credential in a public variable.
// Supplied by frontend/.env.local in development and Vercel in production.
// Empty is supported for same-origin /api deployments such as Docker Compose.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
