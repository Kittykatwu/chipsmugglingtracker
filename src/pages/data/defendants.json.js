import { defendants } from '../../lib/data.js';
export const GET = () => new Response(JSON.stringify(defendants, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
