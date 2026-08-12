import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSessionUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const user = await getSessionUser()
  if (!user || !['scanner', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Not authorized to scan' }, { status: 403 })
  }

  const { ticket_code } = await request.json()

  const { data: ticket, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('ticket_code', ticket_code)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ valid: false, message: 'Ticket not found' }, { status: 404 })
  }

  if (ticket.scanned) {
    return NextResponse.json({ valid: false, message: 'Already checked in', ticket })
  }

  await supabaseAdmin
    .from('tickets')
    .update({ scanned: true, scanned_at: new Date().toISOString(), scanned_by: user.id })
    .eq('ticket_code', ticket_code)

  return NextResponse.json({ valid: true, message: 'Check in successful', ticket })
}