import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Search, Edit2, Eye, Trash2, Power, X, Copy, Check, RefreshCw } from 'lucide-react';
import { fetchTenants, createTenant, updateTenant, deleteTenant } from '../../services/platformApi';
import { useTenant } from '../../context/TenantContext';
import type { Tenant } from '../../types';
import type { BusinessType } from '../../utils/businessConfig';
import { BUSINESS_TYPE_OPTIONS } from '../../utils/businessConfig';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  trial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const TenantList: React.FC = () => {
  const { impersonateTenant } = useTenant();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formType, setFormType] = useState<BusinessType>('food_truck');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const data = await fetchTenants();
      setTenants(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTenants(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(t =>
      t.businessName.toLowerCase().includes(q) ||
      t.ownerEmail.toLowerCase().includes(q) ||
      t.businessType.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    );
  }, [tenants, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const result = await createTenant({
        businessName: formName,
        businessType: formType,
        ownerEmail: formEmail,
        adminUsername: formUsername || undefined,
      });
      setTenants(prev => [...prev, result]);
      if (result.generatedPassword) {
        setGeneratedPassword(result.generatedPassword);
      }
      setShowCreate(false);
      setFormName('');
      setFormSlug('');
      setFormType('food_truck');
      setFormEmail('');
      setFormUsername('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Tenant>) => {
    try {
      const updated = await updateTenant(id, data);
      setTenants(prev => prev.map(t => t.id === id ? updated : t));
      setEditTenant(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTenant(id);
      setTenants(prev => prev.filter(t => t.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImpersonate = async (id: string) => {
    try {
      await impersonateTenant(id);
      window.location.hash = '#/admin';
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    await handleUpdate(tenant.id, { status: newStatus });
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="animate-spin text-purple-400" />
        <span className="ml-3 text-gray-400 text-sm">Loading tenants...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Generated Password Modal */}
      {generatedPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Tenant Created</h3>
            <p className="text-sm text-gray-400 mb-4">Save this password now. It cannot be retrieved later.</p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-xs text-yellow-400 font-medium mb-1">Generated Password</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-yellow-300 flex-1">{generatedPassword}</code>
                <button onClick={copyPassword} className="p-1.5 hover:bg-yellow-500/20 rounded transition-colors">
                  {copiedPassword ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-yellow-400" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => { setGeneratedPassword(null); setCopiedPassword(false); }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-bold text-white">Tenant Management</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Create Tenant
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Business Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Owner Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Created</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Last Active</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  {search ? 'No tenants match your search' : 'No tenants yet'}
                </td>
              </tr>
            ) : (
              filtered.map(tenant => (
                <tr key={tenant.id} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-purple-400 shrink-0" />
                      <span className="font-medium text-white">{tenant.businessName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-gray-400 capitalize">{tenant.businessType.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[tenant.status] || 'text-gray-400'}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{tenant.ownerEmail}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {tenant.lastActiveAt ? new Date(tenant.lastActiveAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTenant(tenant)}
                        title="Edit"
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleImpersonate(tenant.id)}
                        title="Impersonate"
                        className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 rounded transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(tenant)}
                        title={tenant.status === 'active' ? 'Suspend' : 'Activate'}
                        className={`p-1.5 rounded transition-colors ${
                          tenant.status === 'active'
                            ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20'
                            : 'text-green-400 hover:text-green-300 hover:bg-green-900/20'
                        }`}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(tenant.id)}
                        title="Delete"
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete Tenant</h3>
            <p className="text-sm text-gray-400 mb-1">
              Are you sure you want to delete <strong className="text-white">{tenants.find(t => t.id === deleteConfirm)?.businessName}</strong>?
            </p>
            <p className="text-xs text-red-400 mb-4">This action cannot be undone. All tenant data will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Tenant</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-bbq-gold mb-1">Business Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => { setFormName(e.target.value); setFormSlug(slugify(e.target.value)); }}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="My Awesome Business"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-bbq-gold mb-1">Slug</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={e => setFormSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="my-awesome-business"
                />
                <p className="text-[10px] text-gray-500 mt-1">Auto-generated from name</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-bbq-gold mb-1">Business Type</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as BusinessType)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {BUSINESS_TYPE_OPTIONS.map(opt => (
                    <option key={opt.type} value={opt.type}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-bbq-gold mb-1">Owner Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="owner@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-bbq-gold mb-1">Admin Username</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={e => setFormUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="admin"
                />
                <p className="text-[10px] text-gray-500 mt-1">Optional. A password will be auto-generated.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTenant && (
        <EditTenantModal
          tenant={editTenant}
          onSave={(data) => handleUpdate(editTenant.id, data)}
          onClose={() => setEditTenant(null)}
        />
      )}
    </div>
  );
};

// ── Edit Tenant Modal ──────────────────────────────────────────

interface EditModalProps {
  tenant: Tenant;
  onSave: (data: Partial<Tenant>) => Promise<void>;
  onClose: () => void;
}

const EditTenantModal: React.FC<EditModalProps> = ({ tenant, onSave, onClose }) => {
  const [name, setName] = useState(tenant.businessName);
  const [email, setEmail] = useState(tenant.ownerEmail);
  const [type, setType] = useState<BusinessType>(tenant.businessType);
  const [status, setStatus] = useState(tenant.status);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ businessName: name, ownerEmail: email, businessType: type, status });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Edit Tenant</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-bbq-gold mb-1">Business Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-bbq-gold mb-1">Owner Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-bbq-gold mb-1">Business Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as BusinessType)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {BUSINESS_TYPE_OPTIONS.map(opt => (
                <option key={opt.type} value={opt.type}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-bbq-gold mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Tenant['status'])}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantList;
