'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Store {
  store_id: string;
  store_code: number | null;
  store_name: string;
  banner: string | null;
  region: string;
  region_code: string;
  manager_email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminStoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    q: '',
    region: 'all',
    active: 'all'
  });

  useEffect(() => {
    checkAuth();
    fetchRegions();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStores();
    }
  }, [filters, isAdmin]);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user?.role?.toLowerCase() === 'admin') {
        setIsAdmin(true);
      } else {
        router.push('/');
      }
    } catch (e) {
      router.push('/');
    }
  }

  async function fetchRegions() {
    try {
      const res = await fetch('/api/reports/lookups');
      const json = await res.json();
      if (json.ok) {
        setRegions(json.regions || []);
      }
    } catch (e) {
      console.error('Failed to fetch regions:', e);
    }
  }

  async function fetchStores() {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters as any).toString();
      const res = await fetch(`/api/admin/stores?${params}`);
      const json = await res.json();
      if (json.ok) {
        setStores(json.results || []);
      }
    } catch (e) {
      console.error('Failed to fetch stores:', e);
    } finally {
      setLoading(false);
    }
  }

  async function updateField(store_id: string, field: string, value: any) {
    setSaving(store_id);
    try {
      const res = await fetch(`/api/admin/stores/${store_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      });
      
      if (res.ok) {
        // Update local state immediately for instant feedback
        setStores(prev => prev.map(s => 
          s.store_id === store_id ? { ...s, [field]: value } : s
        ));
        setTimeout(() => setSaving(null), 500); // Clear saving state
      } else {
        alert('Failed to update');
        setSaving(null);
      }
    } catch (e) {
      console.error('Failed to update store:', e);
      alert('Error updating store');
      setSaving(null);
    }
  }

  async function handleAddStore() {
    const newStore = {
      store_id: prompt('Enter Store ID (e.g., ST-0100):'),
      store_code: prompt('Enter Store Code (numeric):'),
      store_name: prompt('Enter Store Name:'),
      region_code: prompt('Enter Region Code (e.g., AKL):'),
      region: prompt('Enter Region Name:'),
      manager_email: prompt('Enter Manager Email:'),
      banner: prompt('Enter Banner (optional):') || null,
      active: true
    };

    if (!newStore.store_id || !newStore.store_name) {
      alert('Store ID and Name are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore)
      });

      if (res.ok) {
        fetchStores();
        alert('Store added successfully');
      } else {
        alert('Failed to add store');
      }
    } catch (e) {
      alert('Error adding store');
    }
  }

  async function exportCSV() {
    try {
      const res = await fetch('/api/admin/stores/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'store_master_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export CSV');
    }
  }

  if (!isAdmin) {
    return (
      <div className='min-h-screen bg-black text-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-2xl font-bold mb-4'>Access Denied</div>
          <div className='opacity-70'>Admin access required</div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black text-white p-6'>
      <div className='mx-auto max-w-7xl'>
        <header className='flex items-center justify-between mb-6'>
          <h1 className='text-2xl font-semibold'>Store & Region Management</h1>
          <div className='flex gap-2'>
            <button className='btn bg-green-600 hover:bg-green-700 text-white' onClick={handleAddStore}>
              ➕ Add Store
            </button>
            <button className='btn bg-blue-600 hover:bg-blue-700 text-white' onClick={exportCSV}>
              📥 Export CSV
            </button>
            <button className='btn' onClick={fetchStores}>
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className='card p-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
            <div>
              <label className='text-sm opacity-80 block mb-1'>Search</label>
              <input
                placeholder='Store name or ID...'
                className='input w-full'
                value={filters.q}
                onChange={e => setFilters({ ...filters, q: e.target.value })}
              />
            </div>
            <div>
              <label className='text-sm opacity-80 block mb-1'>Region</label>
              <select className='input w-full' value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value })}>
                <option value='all'>All Regions</option>
                {regions.map(r => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='text-sm opacity-80 block mb-1'>Status</label>
              <select className='input w-full' value={filters.active} onChange={e => setFilters({ ...filters, active: e.target.value })}>
                <option value='all'>All</option>
                <option value='true'>Active</option>
                <option value='false'>Inactive</option>
              </select>
            </div>
            <div className='flex items-end'>
              <span className='text-sm opacity-70'>{stores.length} stores</span>
            </div>
          </div>
        </div>

        {/* Stores Table */}
        {loading ? (
          <div className='card p-8 text-center'>Loading...</div>
        ) : stores.length === 0 ? (
          <div className='card p-8 text-center'>No stores found</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='table w-full'>
              <thead>
                <tr className='bg-gray-900'>
                  <th className='text-left p-3'>Store ID</th>
                  <th className='text-left p-3'>Store Code</th>
                  <th className='text-left p-3'>Store Name</th>
                  <th className='text-left p-3'>Region</th>
                  <th className='text-left p-3'>Region Code</th>
                  <th className='text-left p-3'>Manager Email</th>
                  <th className='text-left p-3'>Banner</th>
                  <th className='text-center p-3'>Active</th>
                  <th className='text-left p-3'>Status</th>
                  <th className='text-left p-3'>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.store_id} className='border-t border-gray-800 hover:bg-gray-900/50'>
                    <td className='p-3 font-mono text-xs'>{store.store_id}</td>
                    <td className='p-3'>
                      <input
                        className='input w-20 bg-transparent border border-transparent hover:border-gray-600 focus:border-blue-500'
                        defaultValue={store.store_code || ''}
                        onBlur={e => {
                          const val = e.target.value ? parseInt(e.target.value) : null;
                          if (val !== store.store_code) {
                            updateField(store.store_id, 'store_code', val);
                          }
                        }}
                      />
                    </td>
                    <td className='p-3'>
                      <input
                        className='input bg-transparent w-full border border-transparent hover:border-gray-600 focus:border-blue-500'
                        defaultValue={store.store_name}
                        onBlur={e => {
                          if (e.target.value !== store.store_name) {
                            updateField(store.store_id, 'store_name', e.target.value);
                          }
                        }}
                      />
                    </td>
                    <td className='p-3'>
                      <input
                        className='input bg-transparent w-32 border border-transparent hover:border-gray-600 focus:border-blue-500'
                        defaultValue={store.region}
                        onBlur={e => {
                          if (e.target.value !== store.region) {
                            updateField(store.store_id, 'region', e.target.value);
                          }
                        }}
                      />
                    </td>
                    <td className='p-3'>
                      <input
                        className='input bg-transparent w-20 text-center border border-transparent hover:border-gray-600 focus:border-blue-500'
                        defaultValue={store.region_code}
                        onBlur={e => {
                          if (e.target.value !== store.region_code) {
                            updateField(store.store_id, 'region_code', e.target.value);
                          }
                        }}
                      />
                    </td>
                    <td className='p-3'>
                      <input
                        className='input bg-transparent w-full border border-transparent hover:border-gray-600 focus:border-blue-500'
                        type='email'
                        defaultValue={store.manager_email || ''}
                        onBlur={e => {
                          if (e.target.value !== (store.manager_email || '')) {
                            updateField(store.store_id, 'manager_email', e.target.value || null);
                          }
                        }}
                      />
                    </td>
                    <td className='p-3'>
                      <input
                        className='input bg-transparent w-24 border border-transparent hover:border-gray-600 focus:border-blue-500'
                        defaultValue={store.banner || ''}
                        onBlur={e => {
                          if (e.target.value !== (store.banner || '')) {
                            updateField(store.store_id, 'banner', e.target.value || null);
                          }
                        }}
                      />
                    </td>
                    <td className='p-3 text-center'>
                      <select
                        className='input bg-transparent px-2 border border-transparent hover:border-gray-600'
                        defaultValue={store.active ? 'true' : 'false'}
                        onChange={e => {
                          const val = e.target.value === 'true';
                          if (val !== store.active) {
                            updateField(store.store_id, 'active', val);
                          }
                        }}
                      >
                        <option value='true'>✓ Active</option>
                        <option value='false'>✗ Inactive</option>
                      </select>
                    </td>
                    <td className='p-3 text-center'>
                      {saving === store.store_id ? (
                        <span className='text-yellow-400 text-xs'>💾 Saving...</span>
                      ) : (
                        <span className='text-green-400 text-xs'>✓ Saved</span>
                      )}
                    </td>
                    <td className='p-3 text-xs opacity-70'>
                      {new Date(store.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

