import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal">
      <div className="modal-title">{title}</div>
      {children}
    </div>
  </div>
);

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(r => setProjects(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setError('');
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading projects…</div>;

  return (
    <div className="page">
      <div className="page-header-row page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''} you're a part of</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No Projects Yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div className="project-name">{p.name}</div>
                <span className={`role-badge ${p.role}`}>{p.role}</span>
              </div>
              <div className="project-desc">{p.description || 'No description provided'}</div>
              <div className="project-meta">
                <span>👥 {p.member_count} member{p.member_count != 1 ? 's' : ''}</span>
                <span>✅ {p.task_count} task{p.task_count != 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="New Project" onClose={() => { setShowModal(false); setError(''); }}>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Project Name *</label>
              <input type="text" placeholder="e.g. Marketing Campaign" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="What is this project about?" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
