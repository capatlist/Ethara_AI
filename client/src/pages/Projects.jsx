import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import { Plus, Search, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';

const PROJECT_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#f97316'];
const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
function getAvatarColor(n) { let h = 0; for (let i = 0; i < (n||'').length; i++) h = n.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; }

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6' });
  const [creating, setCreating] = useState(false);

  const fetchProjects = () => {
    api.get('/projects').then(res => setProjects(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    setCreating(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowCreate(false);
      setForm({ name: '', description: '', color: '#3b82f6' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loader" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Projects</h1>
            <p>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> New Project
          </button>
        </div>
      </div>
      <div className="page-body">
        {projects.length > 0 && (
          <div className="search-input" style={{ marginBottom: 20, maxWidth: 400 }}>
            <Search />
            <input className="form-input" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <FolderKanban size={48} />
            <h3>{search ? 'No matching projects' : 'No projects yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Create your first project to get started'}</p>
            {!search && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Create Project</button>}
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map(project => {
              const counts = project.taskCounts || {};
              const progress = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
              return (
                <div key={project._id} className="project-card" onClick={() => navigate(`/projects/${project._id}`)} style={{ '--card-color': project.color }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: project.color }} />
                  <h3>{project.name}</h3>
                  <p className="project-desc">{project.description || 'No description'}</p>
                  <div className="project-meta">
                    <div className="members-list">
                      <div className="member-avatar" style={{ background: getAvatarColor(project.owner?.name) }}>{project.owner?.avatar}</div>
                      {(project.members || []).slice(0, 3).map((m, i) => (
                        <div key={i} className="member-avatar" style={{ background: getAvatarColor(m.user?.name) }}>{m.user?.avatar}</div>
                      ))}
                      {(project.members || []).length > 3 && (
                        <div className="member-avatar" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>+{project.members.length - 3}</div>
                      )}
                    </div>
                    <div className="task-progress">
                      <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
                      <span className="progress-text">{progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Project" footer={
        <><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create Project'}</button></>
      }>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Project Name *</label>
            <input className="form-input" placeholder="e.g. Marketing Campaign" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" placeholder="What's this project about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
