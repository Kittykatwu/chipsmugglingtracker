import { readRaw } from '../../lib/data.js';
export const GET = () => new Response(readRaw('cases.csv'), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
