'use client';

import { useState } from 'react';
import { useLang } from '@/lib/LanguageContext';

const ROLES = ['student', 'teacher', 'org_admin', 'platform_admin'];

const roleStyle = {
  student:        { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8' },
  teacher:        { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80' },
  org_admin:      { bg: 'rgba(236,72,153,0.1)',  color: '#f472b6' },
  platform_admin: { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24' },
};

export default function UsersClient({ users: initial, teachers, students, assignments: initialAssignments }) {
  const { t, lang } = useLang();
  const [users, setUsers] = useState(initial);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [toast, setToast] = useState(null);
  const [showAssign, setShowAssign] = useState(null); // student id

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const changeRole = async (userId, newRole) => {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(lang === 'zh' ? '角色已更新' : 'Role updated');
    } else {
      showToast((await res.json()).error, true);
    }
  };

  const assignInstructor = async (studentId, teacherId) => {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, teacher_id: teacherId }),
    });
    if (res.ok) {
      setAssignments(prev => [...prev.filter(a => !(a.student_id === studentId && a.teacher_id === teacherId)), { student_id: studentId, teacher_id: teacherId }]);
      showToast(lang === 'zh' ? '老師已指派' : 'Instructor assigned');
    } else {
      showToast((await res.json()).error, true);
    }
  };

  const removeAssignment = async (id) => {
    const res = await fetch('/api/assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAssignments(prev => prev.filter(a => a.id !== id));
      showToast(lang === 'zh' ? '指派已移除' : 'Assignment removed');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const studentAssignments = (studentId) => assignments.filter(a => a.student_id === studentId);
  const assignedTeacherIds = (studentId) => studentAssignments(studentId).map(a => a.teacher_id);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem',
          background: 'linear-gradient(to right, #fff, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {t.manageUsers}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {lang === 'zh' ? `共 ${users.length} 位用戶` : `${users.length} total users`}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder={lang === 'zh' ? '搜尋姓名...' : 'Search by name...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="glass-input"
          style={{ maxWidth: '240px' }}
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="glass-select"
          style={{ maxWidth: '180px' }}
        >
          <option value="all">{lang === 'zh' ? '所有角色' : 'All roles'}</option>
          {ROLES.map(r => <option key={r} value={r}>{t[`role_${r}`]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 160px 180px 140px',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          <span>{lang === 'zh' ? '姓名' : 'Name'}</span>
          <span>{lang === 'zh' ? '角色' : 'Role'}</span>
          <span>{lang === 'zh' ? '加入日期' : 'Joined'}</span>
          <span>{lang === 'zh' ? '操作' : 'Actions'}</span>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            {lang === 'zh' ? '找不到用戶' : 'No users found'}
          </p>
        ) : (
          filtered.map((u, i) => {
            const rs = roleStyle[u.role] || roleStyle.student;
            return (
              <div key={u.id}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 180px 140px',
                  padding: '1rem 1.5rem',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  alignItems: 'center',
                }}>
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 700, color: '#fff',
                    }}>
                      {u.full_name?.[0] || '?'}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#f8fafc' }}>{u.full_name || '—'}</span>
                  </div>

                  {/* Role badge */}
                  <span style={{
                    fontSize: '0.7rem', padding: '3px 10px', borderRadius: '999px',
                    background: rs.bg, color: rs.color, display: 'inline-block', width: 'fit-content',
                  }}>
                    {t[`role_${u.role}`]}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px', padding: '4px 8px', color: '#94a3b8',
                        fontSize: '0.75rem', cursor: 'pointer',
                      }}
                    >
                      {ROLES.map(r => <option key={r} value={r} style={{ background: '#0f172a' }}>{t[`role_${r}`]}</option>)}
                    </select>
                    {u.role === 'student' && (
                      <button
                        onClick={() => setShowAssign(showAssign === u.id ? null : u.id)}
                        style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem',
                          border: '1px solid rgba(99,102,241,0.3)',
                          background: showAssign === u.id ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)',
                          color: '#818cf8', cursor: 'pointer',
                        }}
                      >
                        {lang === 'zh' ? '指派老師' : 'Assign'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Assignment panel */}
                {showAssign === u.id && (
                  <div style={{
                    padding: '1rem 1.5rem 1rem 4rem',
                    background: 'rgba(99,102,241,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                      {lang === 'zh' ? '指派老師給此學生：' : 'Assign instructors to this student:'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {teachers.map(teacher => {
                        const assigned = assignedTeacherIds(u.id).includes(teacher.id);
                        return (
                          <button
                            key={teacher.id}
                            onClick={() => assignInstructor(u.id, teacher.id)}
                            disabled={assigned}
                            style={{
                              padding: '5px 14px', borderRadius: '999px', fontSize: '0.8rem',
                              border: assigned ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.1)',
                              background: assigned ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                              color: assigned ? '#4ade80' : '#94a3b8',
                              cursor: assigned ? 'default' : 'pointer',
                            }}
                          >
                            {assigned ? '✓ ' : ''}{teacher.full_name}
                          </button>
                        );
                      })}
                      {teachers.length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {lang === 'zh' ? '尚無老師' : 'No teachers yet'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.isError ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>
      )}
    </div>
  );
}
