# Copilot Instructions for govchat

## Project Overview
- This is an open source chat UI for AI models, based on Chatbot UI, tailored for EPA and government use. It supports Azure OpenAI, OpenAI, and Google Search plugins.
- The app is built with Next.js (TypeScript), React, and TailwindCSS.

## Architecture & Data Flow
- Main UI components are in `components/`, with chat logic in `components/Chat/Chat.tsx`.
- State management uses React context (`HomeContext` in `utils/home/home.context.ts`).
- Conversations, messages, and folders are typed in `types/` and persisted via localStorage and server APIs.
- Plugin integration (e.g., Google Search) requires API keys, managed in `components/Chatbar/components/PluginKeys.tsx` and stored in localStorage.
- Server-side logic is in `utils/server/` and API routes in `pages/api/`.

## Conventions & Patterns
- **TypeScript everywhere.** All business logic and UI components are typed.
- **State updates:** Someties `homeDispatch({ field, value })` is used for context state changes.
- **Conversation model:**
  - Each conversation has `id`, `name`, `messages`, `model`, `prompt`, `temperature`, and `folderId`.
  - Messages have `role`, `content`, and `timestamp`.


## Key Files & Directories
- `components/Chat/Chat.tsx` — main chat logic and streaming.
- `components/Chatbar/components/PluginKeys.tsx` — plugin key management.
- `utils/app/const.ts` — environment/config constants.
- `utils/server/index.ts` — server-side API logic for OpenAI/Azure.
- `__tests__/` — Vitest tests for utils and data formats.


---


Please provide feedback if any section is unclear or missing details for your workflow.
