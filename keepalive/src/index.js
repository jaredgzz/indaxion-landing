// Lecturas ligeras a `public.keepalive` (sin datos personales; anon solo puede leerla).
// Varias consultas distintas por ejecución para que cuenten como actividad real.
const QUERIES = [
  'keepalive?select=id&limit=1',
  'keepalive?select=*&id=eq.1',
  'keepalive?select=id&id=in.(1)',
]

async function ping(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Faltan los secretos SUPABASE_URL / SUPABASE_ANON_KEY')
  }
  const headers = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
  }

  for (const query of QUERIES) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${query}`, { headers })
    const body = await res.text()
    if (!res.ok) throw new Error(`${query} → HTTP ${res.status}: ${body}`)
    const rows = JSON.parse(body)
    if (!rows.some((row) => row.id === 1)) {
      throw new Error(`${query} no devolvió id = 1: ${body}`)
    }
  }
  console.log(`Supabase OK (${QUERIES.length} consultas)`)

  // Si el ping no llega, el servicio de healthcheck avisa (cubre también fallos del cron)
  if (env.HEALTHCHECK_URL) await fetch(env.HEALTHCHECK_URL)
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(ping(env))
  },
}
