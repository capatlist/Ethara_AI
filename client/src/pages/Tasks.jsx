import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Search, CheckSquare, Calendar } from 'lucide-react';

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'];
function getAC(n){let h=0;for(let i=0;i<(n||'').length;i++)h=n.charCodeAt(i)+((h<<5)-h);return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];}

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (priorityFilter) params.append('priority', priorityFilter);
    if (search) params.append('search', search);
    api.get(`/tasks?${params}`).then(r => setTasks(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [statusFilter, priorityFilter, search]);

  if (loading) return <div className="loader" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <h1>All Tasks</h1>
        <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="search-input" style={{ flex: 1, minWidth: 200 }}>
            <Search />
            <input className="form-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 150 }}>
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="in-review">In Review</option>
            <option value="done">Done</option>
          </select>
          <select className="form-input" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ width: 150 }}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <CheckSquare size={48} />
            <h3>No tasks found</h3>
            <p>Try adjusting your filters or create tasks in a project</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${task.project?._id}`)}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="color-dot" style={{ background: task.project?.color }} />{task.project?.name}</span></td>
                    <td>{task.assignee ? <span className="task-assignee"><span className="avatar-sm" style={{ background: getAC(task.assignee.name) }}>{task.assignee.avatar}</span>{task.assignee.name}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td><span className={`badge badge-${task.status}`}>{task.status.replace('-',' ')}</span></td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td>{task.dueDate ? <span className={new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'overdue' : ''} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
