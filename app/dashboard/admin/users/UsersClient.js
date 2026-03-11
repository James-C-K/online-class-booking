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

export default function UsersClient({ users: initial, teachers, students, assignments: initialAssignments, subjects, teacherSubjects: initialTS }) {
  const { t, lang } = useLang();
  const [users, setUsers] = useState(initial);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [teacherSubjects, setTeacherSubjects] = useState(initialTS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);  // student or teacher id
  const [expandType, setExpandType] = useState(null);  // 'assign' | 'subjects'

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const togglePanel = (id, type) => {
    if (expandedId === id && expandType === type) {
      setExpandedId(null);
      setExpandType(null);
    } else {
      setExpandedId(id);
      setExpandType(type);
    }
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
    const data = await res.json();
    if (res.ok) {
      setAssignments(prev => [...prev.filter(a => !(a.student_id === studentId && a.teacher_id === teacherId)), { student_id: studentId, teacher_id: teacherId, id: data.id }]);
      showToast(lang === 'zh' ? '老師已指派' : 'Instructor assigned');
    } else {
      showToast(data.error, true);
    }
  };

  const removeAssignment = async (assignmentId) => {
    const res = await fetch('/api/assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: assignmentId }),
    });
    if (res.ok) {
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      showToast(lang === 'zh' ? '指派已移除' : 'Assignment removed');
    }
  };

  const toggleTeacherSubject = async (teacherId, subjectId, isAssigned) => {
    if (isAssigned) {
      const res = await fetch('/api/teacher-subjects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId }),
      });
      if (res.ok) {
        setTeacherSubjects(prev => prev.filter(ts => !(ts.teacher_id === teacherId && ts.subject_id === subjectId)));
      }
    } else {
      const res = await fetch('/api/teacher-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, subject_id: subjectId }),
      });
      if (res.ok) {
        setTeacherSubjects(prev => [...prev, { teacher_id: teacherId, subject_id: subjectId }]);
      }
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const studentAssignments = (studentId) => assignments.filter(a => a.student_id === studentId);
  const assignedTeacherIds = (studentId) => studentAssignments(studentId).map(a => a.teacher_id);
  const assignedSubjectIds = (teacherId) => teacherSubjects.filter(ts => ts.teacher_id === teacherId).map(ts => ts.subject_id);

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
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            {lang === 'zh' ? '找不到用戶' : 'No users found'}
          </p>
        ) : (
          filtered.map((u, i) => {
            const rs = roleStyle[u.role] || roleStyle.student;
            const isStudent = u.role === 'student';
            const isTeacher = u.role === 'teacher';
            const myAssignments = studentAssignments(u.id);
            const mySubjectIds = assignedSubjectIds(u.id);
            const isExpandAssign = expandedId === u.id && expandType === 'assign';
            const isExpandSubjects = expandedId === u.id && expandType === 'subjects';

            return (
              <div key={u.id}>
                <div style={{
                  padding: '0.875rem 1.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1rem',
                  alignItems: 'start',
                }}>
                  {/* Left: avatar + info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: '2px',
                    }}>
                      {u.full_name?.[0] || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.875rem', color: '#f8fafc', fontWeight: 500 }}>
                          {u.full_name || '—'}
                        </span>
                        <span style={{
                          fontSize: '0.68rem', padding: '2px 8px', borderRadius: '999px',
                          background: rs.bg, color: rs.color,
                        }}>
                          {t[`role_${u.role}`]}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Assigned teachers (students) */}
                      {isStudent && myAssignments.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {myAssignments.map(a => {
                            const teacher = teachers.find(t => t.id === a.teacher_id);
                            if (!teacher) return null;
                            return (
                              <span key={a.id} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px',
                                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                                color: '#4ade80',
                              }}>
                                👤 {teacher.full_name}
                                <button
                                  onClick={() => removeAssignment(a.id)}
                                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.7rem', padding: '0 0 0 2px', lineHeight: 1 }}
                                  title={lang === 'zh' ? '移除' : 'Remove'}
                                >×</button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Assigned subjects (teachers) */}
                      {isTeacher && mySubjectIds.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {mySubjectIds.map(sid => {
                            const subj = subjects.find(s => s.id === sid);
                            if (!subj) return null;
                            return (
                              <span key={sid} style={{
                                fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px',
                                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                                color: '#818cf8',
                              }}>
                                📚 {lang === 'zh' ? subj.name_zh : subj.name_en}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
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

                    {isStudent && (
                      <button
                        onClick={() => togglePanel(u.id, 'assign')}
                        style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem',
                          border: '1px solid rgba(99,102,241,0.3)',
                          background: isExpandAssign ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)',
                          color: '#818cf8', cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isExpandAssign ? '▲ ' : '▼ '}{lang === 'zh' ? '指派老師' : 'Assign'}
                      </button>
                    )}

                    {isTeacher && (
                      <button
                        onClick={() => togglePanel(u.id, 'subjects')}
                        style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem',
                          border: '1px solid rgba(99,102,241,0.3)',
                          background: isExpandSubjects ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)',
                          color: '#818cf8', cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isExpandSubjects ? '▲ ' : '▼ '}{lang === 'zh' ? '科目' : 'Subjects'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Assign teachers panel */}
                {isExpandAssign && (
                  <div style={{
                    padding: '1rem 1.5rem 1rem 4rem',
                    background: 'rgba(99,102,241,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    animation: 'fadeInUp 0.2s ease both',
                  }}>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.625rem' }}>
                      {lang === 'zh' ? '點擊新增或移除老師：' : 'Click to add or remove instructors:'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {teachers.map(teacher => {
                        const existing = myAssignments.find(a => a.teacher_id === teacher.id);
                        return (
                          <button
                            key={teacher.id}
                            onClick={() => existing ? removeAssignment(existing.id) : assignInstructor(u.id, teacher.id)}
                            style={{
                              padding: '5px 14px', borderRadius: '999px', fontSize: '0.8rem',
                              border: existing ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.1)',
                              background: existing ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                              color: existing ? '#4ade80' : '#94a3b8',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            {existing ? '✓ ' : '+ '}{teacher.full_name}
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

                {/* Teacher subjects panel */}
                {isExpandSubjects && (
                  <div style={{
                    padding: '1rem 1.5rem 1rem 4rem',
                    background: 'rgba(99,102,241,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    animation: 'fadeInUp 0.2s ease both',
                  }}>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.625rem' }}>
                      {lang === 'zh' ? '點擊新增或移除科目：' : 'Click to add or remove subjects:'}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {subjects.map(subj => {
                        const assigned = mySubjectIds.includes(subj.id);
                        return (
                          <button
                            key={subj.id}
                            onClick={() => toggleTeacherSubject(u.id, subj.id, assigned)}
                            style={{
                              padding: '5px 14px', borderRadius: '999px', fontSize: '0.8rem',
                              border: assigned ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.1)',
                              background: assigned ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                              color: assigned ? '#818cf8' : '#94a3b8',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            {assigned ? '✓ ' : '+ '}{lang === 'zh' ? subj.name_zh : subj.name_en}
                          </button>
                        );
                      })}
                      {subjects.length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {lang === 'zh' ? '尚無科目' : 'No subjects yet'}
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
