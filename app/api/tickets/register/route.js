import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { attendee_name, email, pass_type } = await request.json()

  if (!attendee_name || !email || !['sports', 'party', 'both'].includes(pass_type)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // TODO: verify Cloudflare Turnstile token here before inserting

  const ticket_code = crypto.randomUUID()

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .insert([{ ticket_code, attendee_name, email, pass_type }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // unique violation
      return NextResponse.json({ error: 'This email is already registered' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ticket: data })
}