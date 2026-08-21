'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import QRCode from 'qrcode'

const passOptions = [
  { value: 'both', label: 'Sports Day + After-Party', color: 'bg-red-500' },
  { value: 'sports', label: 'Sports Day Only', color: 'bg-green-500' },
  { value: 'party', label: 'After-Party Only', color: 'bg-blue-500' },
]

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [passType, setPassType] = useState('both')
  const [turnstileToken, setTurnstileToken] = useState(null)
  const [ticket, setTicket] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.onTurnstileSuccess = (token) => setTurnstileToken(token)
    return () => { delete window.onTurnstileSuccess }
  }, [])

  const [ticketCount, setTicketCount] = useState(null)
  useEffect(() => {
    fetch('/api/tickets/count')
      .then(res => res.json())
      .then(data => setTicketCount(data.count))
      .catch(() => {})
  }, [])

  const [isFull, setIsFull] = useState(false)

  useEffect(() => {
    fetch('/api/tickets/count')
      .then(res => res.json())
      .then(data => {
        setTicketCount(data.count)
        if (data.count >= 1500) setIsFull(true) 
      })
      .catch(() => {})
  }, [])

  const handleRegister = async () => {
    
    if (!name.trim()) return setError('Please enter your full name')
    if (!email.trim()) return setError('Please enter your email')
    if (!turnstileToken) return setError('Please complete the verification check')
    setLoading(true)
    setError(null)

    const res = await fetch('/api/tickets/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendee_name: name, email, pass_type: passType, turnstile_token: turnstileToken }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 409 && data.error?.includes('full')) {
        setIsFull(true)
      } else {
        setError(data.error || 'Something went wrong, please try again')
      }
      setLoading(false)
      return
    }

    const qr = await QRCode.toDataURL(data.ticket.ticket_code, { width: 300 })
    setTicket(data.ticket)
    setQrDataUrl(qr)
    setLoading(false)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `ticket-${ticket.attendee_name}.png`
    link.click()
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 shadow-xl">
          {isFull ? (
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div className="text-5xl">🎟️</div>
              <h1 className="text-xl font-bold">Registration Full</h1>
              <p className="text-gray-400 text-sm">
                All {1500} tickets have been claimed.
              </p>
            </div>
          ):!ticket ? (
            <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h1 className="text-2xl font-bold">Get Your Ticket</h1>
              <p className="text-gray-400 text-sm mt-1">National Sports Day & After-Party</p>
              {ticketCount !== null && (
                <p className="text-gray-500 text-xs mt-2">{ticketCount} / 1500 registered</p>
              )}
            </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Firstname Lastname"
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. example@email.com"
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Which event? *</label>
                <div className="flex flex-col gap-2">
                  {passOptions.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer border-2 transition-colors ${
                        passType === opt.value ? 'border-green-500 bg-gray-800' : 'border-transparent bg-gray-800/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="passType"
                        value={opt.value}
                        checked={passType === opt.value}
                        onChange={e => setPassType(e.target.value)}
                        className="accent-green-500"
                      />
                      <span className={`w-3 h-3 rounded-full ${opt.color}`} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div
                className="cf-turnstile"
                data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                data-callback="onTurnstileSuccess"
              />

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors mt-2"
              >
                {loading ? 'Registering...' : 'Get My Ticket'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h1 className="text-xl font-bold">You&apos;re Registered!</h1>
                <p className="text-gray-400 text-sm mt-1">Save this QR code — you&apos;ll need it at the gate</p>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <img src={qrDataUrl} alt="Your ticket QR code" className="w-48 h-48" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{ticket.attendee_name}</p>
                <p className="text-gray-400 text-sm">{ticket.email}</p>
              </div>
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-500 rounded-lg py-3 font-semibold transition-colors"
              >
                Download QR Code
              </button>
              <p className="text-gray-500 text-xs text-center">
                Screenshot or save this image now — bring it on your phone to the gate on the day.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}