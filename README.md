# Denominator

A small Next.js chat app where you pick one of three instructor-style personas (Scaler / InterviewBit inspired). Each persona uses a distinct system prompt and the same Gemini model with streaming replies.

## Live demo

Add your Cloud Run URL after you deploy (`gcloud run deploy` as in this repo’s plan).

## Screenshot

Add a screenshot of the chat UI and persona switcher here after you capture one.

## Setup

1. Clone the repo.
2. `npm install`
3. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
4. `npm run dev` and open http://localhost:3000

## Tech stack

- Next.js (App Router)
- React 19
- Google Gemini (`@google/generative-ai`, model `gemini-3-flash-preview`) with SSE streaming
- CSS design tokens (no UI framework)

## Docs for grading

- See `prompts.md` for the three system prompts and why they are shaped the way they are.
- See `reflection.md` for a short writeup on what worked and what you would improve.

## Docker / Cloud Run

The repo includes a multi-stage `Dockerfile` and `output: "standalone"` in `next.config.mjs`. Build and run locally with Docker, or deploy with:

`gcloud run deploy denominator --source . --region asia-south1 --allow-unauthenticated --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY`

(On Windows, set the variable in your environment first or pass the value explicitly.)
