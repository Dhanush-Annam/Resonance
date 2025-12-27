import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'


export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  })
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }
    )

    navigate('/login')
  }

  return (
    <div className="flex-col bg-black flex items-center justify-center w-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-6 rounded-lg w-96"
      >
        <h2 className="text-white text-xl mb-4">Register</h2>

        {['username', 'email', 'password'].map(field => (
          <input
            key={field}
            type={field === 'password' ? 'password' : 'text'}
            placeholder={field}
            className="w-full p-2 mb-3 bg-zinc-800 text-white rounded"
            onChange={(e) =>
              setForm({ ...form, [field]: e.target.value })
            }
          />
        ))}

        <select
          className="w-full p-2 mb-4 bg-zinc-800 text-white rounded"
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="user">User</option>
          <option value="artist">Artist</option>
        </select>

        <button className="w-full bg-green-600 text-white p-2 rounded">
          Register
        </button>
      </form>
      <p className="text-sm text-gray-400 mt-4 text-center">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-green-400 hover:underline"
        >
          Login
        </Link>
      </p>

    </div>
  )
}
