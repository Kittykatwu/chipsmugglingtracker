import { cases } from '../../lib/data.js';
export const GET = () => new Response(JSON.stringify(cases, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
