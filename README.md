# FitSnap

Mobile-first Vietnamese nutrition, meal-photo calorie tracker, pantry ("Có gì nấu nấy") recipe matcher, weekly high-protein meal planner with grocery substitution, and evidence-based body-focus workout planner.

## Features
- **Onboarding + High-Protein Quiz:** Mifflin-St Jeor BMR/TDEE, ISSN protein range (1.6–2.2 g/kg), BMR safety floor & health warnings.
- **Photo Meal Scanner + Pantry Matcher ("Có gì nấu nấy"):** Client-side image compression + Gemini Vision API with `429` model fallback, Ollama local vision support, and Vietnamese nutrition fallback.
- **Body-Focus Workouts:** Bodyweight / Dumbbells / Gym switcher + interactive body region selector with transparent spot-reduction science note and MET burn estimator.
- **Weekly Meal Plan & Grocery Substitution:** 7-day high-protein meal plan with 1-click dish swap and 1-click grocery ingredient substitution.
- **Cloud Sync (Supabase):** Full Supabase Auth + PostgreSQL Row-Level Security (`supabase/migrations/001_initial_schema.sql`), with automatic local JSON fallback when Supabase env vars are omitted.

## Setup & Deploy (Vercel + Supabase)
1. In your Supabase project (**`sinbad`**), open **SQL Editor** and run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).
2. Copy `.env.example` to `.env.local` (or set Environment Variables on Vercel):
   - `NEXT_PUBLIC_SUPABASE_URL` (from Supabase **Settings -> Data API**)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (from Supabase **Settings -> API Keys**)
   - `GEMINI_API_KEY` (optional, from Google AI Studio)
3. Run locally:
   ```bash
   npm install
   npm run dev
   ```
4. Run tests & production build:
   ```bash
   npm test
   npm run build
   ```
