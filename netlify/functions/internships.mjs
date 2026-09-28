import { getDatabase } from '../../server/db.js';
import { configuration, createAPI } from '../../server/api.js';
let handler;
export default async (request, context) => {
  try {
    // Hosted functions always require production cookie/origin/secret configuration.
    // Local development uses server/local.js instead of weakening this adapter.
    handler ||= createAPI(getDatabase(), configuration({ ...process.env, NODE_ENV: 'production' }));
    return await handler(request, { ip: context.ip || 'unknown' });
  } catch {
    return Response.json({ error: 'The internship service is awaiting server configuration.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
};
