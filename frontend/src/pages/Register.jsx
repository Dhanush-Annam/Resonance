import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, User, AlertCircle } from 'lucide-react'
import Input from '../components/Input'
import Button from '../components/Button'

/**
 * Resonance Design System — Authentication Surface (Register)
 *
 * Conforms to DESIGN.md Section 2 & 4:
 * - Surface: canvas-subtle (#14161a) with surface-elevated (#1e2027) card
 * - Typography: Instrument Serif editorial header, Plus Jakarta Sans body
 * - Inputs: <Input /> primitive with border-control (#687084, 3.51:1 verified)
 * - Button: <Button variant="primary" /> off-white (#f5f2eb) / dark (#101114) text
 * - Focus: border-focus (#f5f2eb, 16.89:1) ring
 * - Error: status-rejected tokens with role="alert"
 * - No decorative glows, gradients, or skeuomorphic elements
 */
export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Registration failed')
        setLoading(false)
        return
      }

      navigate('/login')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] bg-canvas-subtle flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-elevated border border-border-rule rounded-lg shadow-level-3 p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-sm bg-surface-raised border border-border-rule flex items-center justify-center mb-4">
            <img src="/favicon-wave-blue.svg" alt="Resonance logo" className="h-5 w-5 object-contain" />
          </div>
          <h1 className="font-serif text-2xl text-text-primary tracking-tight">Create Account</h1>
          <p className="text-xs text-text-secondary font-sans mt-1">Join Resonance to save playlists and stream</p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 mb-5 rounded-sm bg-status-rejected-bg border border-status-rejected-bd text-status-rejected-fg text-xs font-sans"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            required
            placeholder="audiophile"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            leftIcon={<User className="w-4 h-4" />}
            autoComplete="username"
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
          />

          <div className="flex flex-col space-y-1.5 w-full">
            <label
              htmlFor="account-type"
              className="text-[11px] font-mono font-medium tracking-wider text-text-secondary uppercase select-none"
            >
              Account Type
            </label>
            <select
              id="account-type"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-1.5 rounded-sm bg-surface-raised text-xs sm:text-sm text-text-primary font-sans border border-border-control focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-1 focus-visible:ring-border-focus transition duration-150"
            >
              <option value="user">Listener (Regular User)</option>
              <option value="artist">Artist (Upload &amp; Manage Music)</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full mt-2"
          >
            Create Account
          </Button>
        </form>

        <p className="text-xs text-text-secondary font-sans mt-6 text-center">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-accent-text hover:underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus rounded-xs"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
