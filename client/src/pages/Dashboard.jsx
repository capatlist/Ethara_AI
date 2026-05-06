import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, ArrowRight, FolderKanban } from 'lucide-react';

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  const now = new Date();
  const diff = date - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard').then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  const stats = data?.stats || {};

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's what's happening with your projects today.</p>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}><CheckSquare size={20} color="#3b82f6" /></div>
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Clock size={20} color="#f59e0b" /></div>
            <div className="stat-value">{stats['in-progress'] || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><TrendingUp size={20} color="#10b981" /></div>
            <div className="stat-value">{stats.done || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertTriangle size={20} color="#ef4444" /></div>
            <div className="stat-value">{data?.overdueCount || 0}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* My Tasks */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">My Tasks</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View All <ArrowRight size={14} /></button>
            </div>
            {(!data?.myTasks || data.myTasks.length === 0) ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tasks assigned to you</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.myTasks.slice(0, 5).map(task => (
                  <div key={task._id} className="task-card" onClick={() => navigate(`/projects/${task.project?._id}`)}>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
                      {task.dueDate && (
                        <span style={{ fontSize: '0.75rem' }} className={isOverdue(task.dueDate) ? 'overdue' : ''}>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--accent-red)' }}>⚠ Overdue Tasks</span>
            </div>
            {(!data?.overdueTasks || data.overdueTasks.length === 0) ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No overdue tasks 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.overdueTasks.slice(0, 5).map(task => (
                  <div key={task._id} className="task-card" onClick={() => navigate(`/projects/${task.project?._id}`)}>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <div className="task-assignee">
                        {task.assignee && (
                          <>
                            <div className="avatar-sm" style={{ background: getAvatarColor(task.assignee.name) }}>{task.assignee.avatar}</div>
                            {task.assignee.name}
                          </>
                        )}
                      </div>
                      <span className="overdue" style={{ fontSize: '0.75rem' }}>{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>All Projects <ArrowRight size={14} /></button>
          </div>
          {(!data?.recentTasks || data.recentTasks.length === 0) ? (
            <div className="empty-state">
              <FolderKanban size={40} />
              <h3>No activity yet</h3>
              <p>Create a project and start adding tasks!</p>
              <button className="btn btn-primary" onClick={() => navigate('/projects')}>Create Project</button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTasks.map(task => (
                    <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${task.project?._id}`)}>
                      <td style={{ fontWeight: 500 }}>{task.title}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="color-dot" style={{ background: task.project?.color }} />
                          {task.project?.name}
                        </span>
                      </td>
                      <td>
                        {task.assignee ? (
                          <span className="task-assignee">
                            <span className="avatar-sm" style={{ background: getAvatarColor(task.assignee.name) }}>{task.assignee.avatar}</span>
                            {task.assignee.name}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                      </td>
                      <td><span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
