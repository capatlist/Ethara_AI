import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>✦ Ethara AI</h1>
          <p>Team Task Manager</p>
        </div>
        <h2>Welcome back</h2>
        <p className="subtitle">Sign in to your account to continue</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 36, paddingRight: 40 }} type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" className="btn-icon" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
