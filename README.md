# AI Finance & Expense Management Dashboard

A full-stack personal finance tracker and intelligent expense analytics dashboard built with Next.js, Supabase, and Google Gemini AI insights.

## Features

- **Real-Time Expense & Income Tracking**: Track income, categorised expenses, recurring transactions, and savings goals.
- **AI Financial Assistant**: Integrated Gemini AI chat widget that analyses personal spending trends and suggests budget optimisations.
- **Interactive Analytics**: Monthly and category-wise visual breakdowns with Framer Motion animations.
- **Supabase Cloud Sync**: Real-time multi-device database synchronisation with secure row-level security policies.
- **PWA & Mobile Notifications**: Web push notification service worker support for daily financial check-ins.

## Tech Stack

- **Framework**: Next.js (App Router), React
- **Styling & UI**: Tailwind CSS, Framer Motion, Lucide Icons
- **Database & Auth**: Supabase PostgreSQL
- **AI Engine**: Google Generative AI (Gemini) SDK
- **Runtime**: Node.js / Express backend sync service

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Provide your Supabase URL, Anon Key, and Gemini API credentials.

3. Start development server:
   ```bash
   npm run dev
   ```
