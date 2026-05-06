import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users as UsersIcon } from 'lucide-react';

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'];
function getAC(n){let h=0;for(let i=0;i<(n||'').length;i++)h=n.charCodeAt(i)+((h<<5)-h);return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];}

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <h1>Team</h1>
        <p>{users.length} member{users.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="page-body">
        {users.length === 0 ? (
          <div className="empty-state"><UsersIcon size={48} /><h3>No team members</h3></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {users.map(u => (
              <div key={u._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: getAC(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{u.avatar}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  <span className={`badge ${u.role === 'admin' ? 'badge-in-review' : 'badge-todo'}`} style={{ marginTop: 4 }}>{u.role}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
