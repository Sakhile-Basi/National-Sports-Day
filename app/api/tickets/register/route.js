import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

const TICKET_CAP = 1250

export async function POST(request) {
  const { attendee_name, email, pass_type, turnstile_token } = await request.json()

  if (!attendee_name || !email || !['sports', 'party', 'both'].includes(pass_type)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  if (!turnstile_token) {
    return NextResponse.json({ error: 'Verification check missing' }, { status: 400 })
  }

  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: turnstile_token,
    }),
  })
  const verifyData = await verifyRes.json()

  if (!verifyData.success) {
    return NextResponse.json({ error: 'Verification failed, please try again' }, { status: 400 })
  }

  const { count, error: countError } = await supabaseAdmin
    .from('tickets')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    return NextResponse.json({ error: 'Something went wrong, please try again' }, { status: 500 })
  }

  if (count >= TICKET_CAP) {
    return NextResponse.json({ error: 'Registration is full — no more tickets are available' }, { status: 409 })
  }

  const ticket_code = crypto.randomUUID()

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .insert([{ ticket_code, attendee_name, email, pass_type }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ticket: data })
}