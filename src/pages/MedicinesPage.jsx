import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import MedicineFormModal from '../components/MedicineFormModal';
import { SkeletonRows } from '../components/ui/Skeleton';
import { can, P } from '../constants/permissions';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { confirmAction } from '../utils/display';

function strengthLabel(m) {
  const parts = [m.strength, m.strengthUnit].filter(Boolean);
  return parts.join(' ') || '—';
}

function typeLabel(m) {
  return String(m.dosageForm || '').toUpperCase() || '—';
}

export default function MedicinesPage() {
  const { user } = useAuth();
  const { branchId } = useBranch();
  const canManage = can(user, P.MEDICINE_MANAGE);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = (p = 1) => {
    setLoading(true);
    api
      .get('/medicines', { params: { page: p, q, limit: 20 } })
      .then((res) => {
        setRows(res.data.medicines || []);
        setPages(res.data.pages || 1);
        setPage(res.data.page || 1);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Load failed.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const removeMedicine = async (m) => {
    const ok = await confirmAction(`Remove “${m.name}” from the medicine master?`);
    if (!ok) return;
    try {
      await api.patch(`/medicines/${m._id}`, { isActive: false });
      toast.success('Medicine removed.');
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove medicine.');
    }
  };

  const rowOffset = (page - 1) * 20;

  return (
    <div className="page-container">
      <PageHeader
        title="Medicine master"
        actions={
          canManage && (
            <button type="button" className="btn-primary" onClick={openAdd}>
              <Plus className="w-4 h-4" aria-hidden /> Add new
            </button>
          )
        }
      />

      <form
        className="mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          load(1);
        }}
      >
        <input
          className="input-field max-w-md"
          placeholder="Search name, salt, or company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      {loading ? (
        <SkeletonRows />
      ) : !rows.length ? (
        <EmptyState
          title="No medicines"
          description="Add medicines to use in prescriptions and inventory."
          action={
            canManage && (
              <button type="button" className="btn-primary" onClick={openAdd}>
                Add new
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="hidden md:block card !p-0 overflow-hidden">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Strength</th>
                    <th>Salt</th>
                    <th>Company</th>
                    {canManage && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m, index) => (
                    <tr key={m._id}>
                      <td className="text-ink-faint tabular-nums">{rowOffset + index + 1}</td>
                      <td className="font-medium text-ink">{m.name}</td>
                      <td className="uppercase text-ink-muted">{typeLabel(m)}</td>
                      <td className="text-ink-muted whitespace-nowrap">{strengthLabel(m)}</td>
                      <td className="text-ink-muted">{m.genericName || '—'}</td>
                      <td className="text-ink-muted">{m.manufacturer || '—'}</td>
                      {canManage && (
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              className="btn-ghost !min-h-9 !px-2 text-sky-700"
                              aria-label={`Edit ${m.name}`}
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="btn-ghost !min-h-9 !px-2 text-red-600"
                              aria-label={`Delete ${m.name}`}
                              onClick={() => removeMedicine(m)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-2">
            {rows.map((m, index) => (
              <div key={m._id} className="card !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-ink-faint tabular-nums">#{rowOffset + index + 1}</p>
                    <p className="font-semibold text-ink truncate">{m.name}</p>
                    <p className="text-sm text-ink-muted mt-1 uppercase">{typeLabel(m)}</p>
                    <p className="text-xs text-ink-faint mt-1">
                      {strengthLabel(m)} · {m.genericName || '—'}
                    </p>
                    <p className="text-xs text-ink-faint">{m.manufacturer || '—'}</p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="btn-ghost !min-h-9 !px-2 text-sky-700"
                        aria-label={`Edit ${m.name}`}
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost !min-h-9 !px-2 text-red-600"
                        aria-label={`Delete ${m.name}`}
                        onClick={() => removeMedicine(m)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} pages={pages} onPage={load} />

      <MedicineFormModal
        open={open}
        editing={editing}
        onClose={closeModal}
        onSaved={() => load(editing?._id ? page : 1)}
      />
    </div>
  );
}
