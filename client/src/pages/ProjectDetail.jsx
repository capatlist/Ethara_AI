import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import { Plus, ArrowLeft, UserPlus, Trash2, Settings, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#64748b' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'in-review', label: 'In Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' }
];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'];
function getAC(n){let h=0;for(let i=0;i<(n||'').length;i++)h=n.charCodeAt(i)+((h<<5)-h);return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignee: '', priority: 'medium', status: 'todo', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks?project=${id}`)]);
      setProject(pRes.data);
      setTasks(tRes.data);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); api.get('/users').then(r => setAllUsers(r.data)).catch(() => {}); }, [id]);

  const isAdmin = project?.userRole === 'owner' || project?.userRole === 'admin';
  const allMembers = project ? [{ user: project.owner, role: 'owner' }, ...(project.members || [])] : [];

  const openCreateTask = (status = 'todo') => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignee: '', priority: 'medium', status, dueDate: '' });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title, description: task.description || '', assignee: task.assignee?._id || '',
      priority: task.priority, status: task.status, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ''
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = { ...taskForm, project: id, dueDate: taskForm.dueDate || null, assignee: taskForm.assignee || null };
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created');
      }
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) { toast.error('Failed to update status'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t._id !== taskId));
      setShowTaskModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail) return toast.error('Email is required');
    try {
      const res = await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setProject(res.data);
      setMemberEmail('');
      toast.success('Member added');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data);
      toast.success('Member removed');
    } catch (err) { toast.error('Failed to remove member'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete project'); }
  };

  if (loading) return <div className="loader" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!project) return null;

  return (
    <>
      <div className="page-header">
        <div className="page-header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={20} /></button>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="color-dot" style={{ background: project.color, width: 14, height: 14 }} />
                {project.name}
              </h1>
              <p>{project.description || 'No description'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}><UserPlus size={16} /> Members</button>}
            <button className="btn btn-primary btn-sm" onClick={() => openCreateTask()}><Plus size={16} /> Add Task</button>
            {project.userRole === 'owner' && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}><Trash2 size={16} /></button>}
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Members strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 4 }}>Team:</span>
          {allMembers.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-tertiary)', padding: '4px 10px 4px 4px', borderRadius: 20, fontSize: '0.8rem' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: getAC(m.user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'white' }}>{m.user?.avatar}</div>
              {m.user?.name}
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({m.role})</span>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className="color-dot" style={{ background: col.color }} />
                    {col.label}
                    <span className="kanban-column-count">{colTasks.length}</span>
                  </div>
                  <button className="btn-icon" onClick={() => openCreateTask(col.id)}><Plus size={16} /></button>
                </div>
                <div className="kanban-tasks">
                  {colTasks.map(task => (
                    <div key={task._id} className="task-card" onClick={() => openEditTask(task)}>
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {task.assignee && (
                          <div className="task-assignee">
                            <div className="avatar-sm" style={{ background: getAC(task.assignee.name) }}>{task.assignee.avatar}</div>
                            {task.assignee.name?.split(' ')[0]}
                          </div>
                        )}
                      </div>
                      {task.dueDate && (
                        <div style={{ fontSize: '0.7rem', color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--accent-red)' : 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title={editingTask ? 'Edit Task' : 'Create Task'} footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          {editingTask && <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(editingTask._id)}><Trash2 size={14} /> Delete</button>}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveTask} disabled={saving}>{saving ? 'Saving...' : editingTask ? 'Update' : 'Create'}</button>
          </div>
        </div>
      }>
        <form onSubmit={handleSaveTask}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" placeholder="Describe the task..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Status</label>
              <select className="form-input" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-input" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Assignee</label>
              <select className="form-input" value={taskForm.assignee} onChange={e => setTaskForm({...taskForm, assignee: e.target.value})}>
                <option value="">Unassigned</option>
                {allMembers.map((m, i) => <option key={i} value={m.user?._id}>{m.user?.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Member Modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Manage Members">
        <form onSubmit={handleAddMember} style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label>Add Member by Email</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="user@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} style={{ flex: 1 }} />
              <select className="form-input" value={memberRole} onChange={e => setMemberRole(e.target.value)} style={{ width: 110 }}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm">Add</button>
            </div>
          </div>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allMembers.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: getAC(m.user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>{m.user?.avatar}</div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{m.user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.user?.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge badge-${m.role === 'owner' ? 'in-progress' : m.role === 'admin' ? 'in-review' : 'todo'}`}>{m.role}</span>
                {m.role !== 'owner' && isAdmin && (
                  <button className="btn-icon" onClick={() => handleRemoveMember(m.user?._id)} style={{ color: 'var(--accent-red)' }}><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
