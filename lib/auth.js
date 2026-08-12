import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  return profile ? { id: user.id, role: profile.role, name: profile.full_name } : null
}