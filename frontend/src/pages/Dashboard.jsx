import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const StatusBar = ({ todo, in_progress, done }) => {
  const total = (todo + in_progress + done) || 1;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Progress</div>
      <div style={{ display: 'flex', gap: 3, height: 10, borderRadius: 6, overflow: 'hidden', background: 'var(--bg3)' }}>
        <div style={{ width: `${(done/total)*100}%`, background: 'var(--green)', transition: 'width 0.6s ease' }} />
        <div style={{ width: `${(in_progress/total)*100}%`, background: 'var(--yellow)', transition: 'width 0.6s ease' }} />
        <div style={{ width: `${(todo/total)*100}%`, background: 'var(--border2)' }} />
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
        {[['Done', done, 'var(--green)'], ['In Progress', in_progress, 'var(--yellow)'], ['To Do', todo, 'var(--border2)']].map(([l, v, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text3)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            <span>{l}: <strong style={{ color: 'var(--text)' }}>{v}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading dashboard…</div>;

  const { totalTasks = 0, tasksByStatus = {}, overdueTasks = 0, myTasks = 0, tasksPerUser = [], recentTasks = [] } = stats || {};

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</div>
        <div className="page-sub">Here's what's happening across your projects</div>
      </div>

      <div className="stats-grid">
        {[
          ['Total Tasks', totalTasks, 'blue'],
          ['Done', tasksByStatus.done || 0, 'green'],
          ['In Progress', tasksByStatus.in_progress || 0, 'yellow'],
          ['Overdue', overdueTasks, 'red'],
          ['Assigned to Me', myTasks, ''],
          ['To Do', tasksByStatus.todo || 0, ''],
        ].map(([label, value, color]) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className={`stat-value ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <StatusBar
        todo={tasksByStatus.todo || 0}
        in_progress={tasksByStatus.in_progress || 0}
        done={tasksByStatus.done || 0}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="section-title">Tasks Per User</div>
          {tasksPerUser.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No assigned tasks yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasksPerUser.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{u.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{u.name}</div>
                    <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min((u.task_count / (tasksPerUser[0]?.task_count || 1)) * 100, 100)}%`,
                        height: '100%', background: 'var(--accent)', borderRadius: 4, transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', minWidth: 20, textAlign: 'right' }}>{u.task_count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Recent Tasks</div>
          {recentTasks.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentTasks.map(t => (
                <Link to={`/projects/${t.project_id}`} key={t.id} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: 10, background: 'var(--bg3)', borderRadius: 6, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{t.title}</div>
                      <span className={`status-badge ${t.status}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{t.project_name}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
