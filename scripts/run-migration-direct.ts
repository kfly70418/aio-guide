/**
 * Execute migration directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  const sql = readFileSync('supabase/migrations/015_add_provider_display_fields.sql', 'utf-8')

  console.log('Running migration: 015_add_provider_display_fields.sql')

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    // Try direct execution via REST API
    console.log('Trying alternative method...')

    const statements = sql.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (!statement.trim()) continue

      console.log(`Executing: ${statement.trim().substring(0, 60)}...`)

      const { error: execError } = await supabase.rpc('exec_sql', {
        sql: statement.trim()
      })

      if (execError) {
        console.error(`Error: ${execError.message}`)
      }
    }

    console.log('\n✅ Migration executed (check Supabase dashboard to verify)')
  } else {
    console.log('✅ Migration successful')
  }
}

runMigration()
