let client;

function getSupabaseClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_API_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(url, key);
    return client;
  } catch (err) {
    console.warn('Supabase JS no instalado (npm install):', err.message);
    return null;
  }
}

async function probeSupabaseConnection() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log('  Supabase JS: skipped (SUPABASE_URL / SUPABASE_API_KEY not set)');
    return true;
  }

  const { data, error } = await supabase.from('users').select('id').limit(1);

  if (error) {
    console.error('Supabase JS connection error:', error.message);
    return false;
  }

  console.log('Supabase JS connected (users probe ok)', data?.length ?? 0, 'row(s)');
  return true;
}

module.exports = {
  getSupabaseClient,
  probeSupabaseConnection,
};
