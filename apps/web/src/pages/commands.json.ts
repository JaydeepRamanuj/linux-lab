import type { APIRoute } from 'astro';
import { commandDocEntries } from '../lib/anatomy';

// Prerendered to /commands.json at build time; the Explainer fetches it for anatomy notes.
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await commandDocEntries()), { headers: { 'Content-Type': 'application/json' } });
