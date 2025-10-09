'use client';

import { useEffect, useMemo, useState } from 'react';
import LoadingButton from '@/components/LoadingButton';
import Spinner from '@/components/Spinner';

function Text({ children }: { children: any }) {
  return <span className='text-sm'>{children}</span>;
}

export default function UsersAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin/users', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Failed');
      setRows(j.users || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const data = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r: any) =>
      Object.values({ a: r.user_id, b: r.full_name, c: r.email, d: r.role })
        .join(' ')
        .toLowerCase()
        .includes(s)
    );
  }, [rows, q]);

  return (
    <div className='space-y-6'>
      <header className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>Admin — Users</h1>
          <div className='text-xs text-white/60 mt-1'>
            Add, deactivate, reset passwords, or delete users.
          </div>
        </div>
        <AddUser onDone={load} />
      </header>

      <div className='flex items-center gap-2'>
        <input
          className='btn p-2 w-full md:w-80'
          placeholder='Search (name, user id, email, role)'
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <LoadingButton onClick={load} className='btn'>
          Refresh
        </LoadingButton>
      </div>

      {loading ? (
        <div className='flex items-center gap-2 text-sm'>
          <Spinner /> Loading users…
        </div>
      ) : error ? (
        <div className='text-sm text-red-400'>{error}</div>
      ) : (
        <div className='overflow-x-auto border border-white/10 rounded-xl'>
          <table className='min-w-full text-sm'>
            <thead className='bg-white/5'>
              <tr>
                <th className='text-left p-3'>User ID</th>
                <th className='text-left p-3'>Name</th>
                <th className='text-left p-3'>Email</th>
                <th className='text-left p-3'>Role</th>
                <th className='text-left p-3'>Active</th>
                <th className='text-right p-3'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r: any) => (
                <tr key={r.id} className='border-t border-white/5'>
                  <td className='p-3 font-mono'>{r.user_id}</td>
                  <td className='p-3'>{r.full_name}</td>
                  <td className='p-3'>{r.email || '—'}</td>
                  <td className='p-3'>
                    <RoleSelect id={r.id} role={r.role} onChange={() => load()} />
                  </td>
                  <td className='p-3'>
                    <ActiveToggle id={r.id} active={!!r.is_active} onChange={() => load()} />
                  </td>
                  <td className='p-3 text-right'>
                    <ResetPass id={r.id} onDone={load} />
                    <DeleteUser id={r.id} onDone={load} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddUser({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [user_id, setUid] = useState('');
  const [full_name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('StoreManager');

  async function create() {
    const r = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, full_name, email, role })
    });
    if (!r.ok) {
      alert('Failed to create user');
      return;
    }
    setOpen(false);
    setUid('');
    setName('');
    setEmail('');
    setRole('StoreManager');
    onDone();
  }

  return (
    <div>
      <LoadingButton onClick={() => setOpen(true)} className='btn btn-liquid'>
        Add user
      </LoadingButton>
      {open && (
        <div className='fixed inset-0 z-30 flex'>
          <div className='flex-1' onClick={() => setOpen(false)} />
          <div className='w-full sm:w-[420px] bg-black border-l border-white/10 p-5 space-y-3'>
            <h3 className='font-semibold'>New User</h3>
            <input
              className='btn p-2 w-full'
              placeholder='User ID'
              value={user_id}
              onChange={e => setUid(e.target.value)}
            />
            <input
              className='btn p-2 w-full'
              placeholder='Full name'
              value={full_name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className='btn p-2 w-full'
              placeholder='Email (optional)'
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <select className='btn p-2 w-full' value={role} onChange={e => setRole(e.target.value)}>
              <option>StoreManager</option>
              <option>ELT</option>
              <option>Admin</option>
            </select>
            <div className='flex gap-2 justify-end'>
              <button className='btn' onClick={() => setOpen(false)}>
                Cancel
              </button>
              <LoadingButton onClick={create} className='btn btn-liquid'>
                Create
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleSelect({ id, role, onChange }: { id: string; role: string; onChange: () => void }) {
  const [val, setVal] = useState(role || 'StoreManager');

  async function save(nv: string) {
    setVal(nv);
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nv })
    });
    if (!r.ok) alert('Failed to update role');
    else onChange();
  }

  return (
    <select className='btn p-2' value={val} onChange={e => save(e.target.value)}>
      <option>StoreManager</option>
      <option>ELT</option>
      <option>Admin</option>
    </select>
  );
}

function ActiveToggle({ id, active, onChange }: { id: string; active: boolean; onChange: () => void }) {
  const [val, setVal] = useState(active);

  async function toggle() {
    const nv = !val;
    setVal(nv);
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: nv })
    });
    if (!r.ok) alert('Failed to update status');
    else onChange();
  }

  return (
    <button className={`btn ${val ? 'bg-white/10' : 'bg-white/5'}`} onClick={toggle}>
      {val ? 'Active' : 'Inactive'}
    </button>
  );
}

function ResetPass({ id, onDone }: { id: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');

  async function reset() {
    if (pw.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset_password: pw })
    });
    if (!r.ok) {
      alert('Failed to reset password');
      return;
    }
    setOpen(false);
    setPw('');
    onDone();
  }

  return (
    <span className='inline-flex gap-2'>
      <button className='btn' onClick={() => setOpen(true)}>
        Reset PW
      </button>
      {open && (
        <div className='fixed inset-0 z-30 flex'>
          <div className='flex-1' onClick={() => setOpen(false)} />
          <div className='w-full sm:w-[420px] bg-black border-l border-white/10 p-5 space-y-3'>
            <h3 className='font-semibold'>Reset password</h3>
            <input
              className='btn p-2 w-full'
              type='password'
              placeholder='New password (min 8 chars)'
              value={pw}
              onChange={e => setPw(e.target.value)}
            />
            <div className='flex gap-2 justify-end'>
              <button className='btn' onClick={() => setOpen(false)}>
                Cancel
              </button>
              <LoadingButton onClick={reset} className='btn btn-liquid'>
                Save
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

function DeleteUser({ id, onDone }: { id: string; onDone: () => void }) {
  const [confirm, setConfirm] = useState(false);

  async function del() {
    const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      alert('Delete failed');
      return;
    }
    setConfirm(false);
    onDone();
  }

  return (
    <span className='inline-flex gap-2'>
      <button className='btn' onClick={() => setConfirm(true)}>
        Delete
      </button>
      {confirm && (
        <div className='fixed inset-0 z-30 flex'>
          <div className='flex-1' onClick={() => setConfirm(false)} />
          <div className='w-full sm:w-[420px] bg-black border-l border-white/10 p-5 space-y-3'>
            <h3 className='font-semibold'>Confirm delete</h3>
            <Text>Deleting a user is permanent. Consider setting Inactive instead.</Text>
            <div className='flex gap-2 justify-end'>
              <button className='btn' onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <LoadingButton onClick={del} className='btn btn-liquid'>
                Delete
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

