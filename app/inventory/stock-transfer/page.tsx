'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  Download,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Warehouse,
} from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatDateTime } from '@/lib/utils';
import { exportToCSV } from '@/lib/export';
import type { StockTransfer, RawMaterial } from '@/types';

export default function StockTransferPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    material: '',
    quantity: '',
    fromWarehouse: '',
    toWarehouse: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
    status: 'Pending',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  }, [formData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transferRecords, materialRecords] = await Promise.all([
        tables.stockTransfer
          .select({
            maxRecords: 100,
            sort: [{ field: 'Date', direction: 'desc' }],
          })
          .all(),
        tables.rawMaterials
          .select({
            maxRecords: 100,
            sort: [{ field: 'Material Name', direction: 'asc' }],
          })
          .all(),
      ]);

      const transfersData = transferRecords.map((record) => ({
        id: record.id,
        fields: record.fields as StockTransfer['fields'],
      }));

      const materialsData = materialRecords.map((record) => ({
        id: record.id,
        fields: record.fields as RawMaterial['fields'],
      }));

      setTransfers(transfersData);
      setMaterials(materialsData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransfer = async () => {
    try {
      setSaving(true);
      await tables.stockTransfer.create([
        {
          fields: {
            'Material': [formData.material],
            'Quantity Transferred': parseFloat(formData.quantity) || 0,
            'From Warehouse': [formData.fromWarehouse],
            'To Warehouse': [formData.toWarehouse],
            'Date': formData.date,
            'Remarks': formData.remarks,
            'Status': formData.status,
          },
        },
      ]);

      alert('Transfer created successfully!');
      setShowAddModal(false);
      setFormData({
        material: '',
        quantity: '',
        fromWarehouse: '',
        toWarehouse: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        status: 'Pending',
      });
      fetchData();
    } catch (error) {
      alert('Failed to create transfer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTransfer = async () => {
    if (!selectedTransfer) return;

    try {
      setSaving(true);
      await tables.stockTransfer.update([
        {
          id: selectedTransfer.id,
          fields: {
            'Material': [formData.material],
            'Quantity Transferred': parseFloat(formData.quantity) || 0,
            'From Warehouse': [formData.fromWarehouse],
            'To Warehouse': [formData.toWarehouse],
            'Date': formData.date,
            'Remarks': formData.remarks,
            'Status': formData.status,
          },
        },
      ]);

      alert('Transfer updated successfully!');
      setShowEditModal(false);
      setShowDetailModal(false);
      setSelectedTransfer(null);
      fetchData();
    } catch (error) {
      alert('Failed to update transfer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransfer = async () => {
    if (!selectedTransfer) return;

    if (!confirm(`Are you sure you want to delete this transfer? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      await tables.stockTransfer.destroy([selectedTransfer.id]);

      alert('Transfer deleted successfully!');
      setShowDetailModal(false);
      setSelectedTransfer(null);
      fetchData();
    } catch (error) {
      alert('Failed to delete transfer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {

    if (!selectedTransfer) {
      return;
    }

    const newFormData = {
      material: selectedTransfer.fields['Material']?.[0] || '',
      quantity: String(selectedTransfer.fields['Quantity Transferred'] || 0),
      fromWarehouse: selectedTransfer.fields['From Warehouse']?.[0] || '',
      toWarehouse: selectedTransfer.fields['To Warehouse']?.[0] || '',
      date: selectedTransfer.fields['Date'] || new Date().toISOString().split('T')[0],
      remarks: selectedTransfer.fields['Remarks'] || '',
      status: selectedTransfer.fields['Status'] || 'Pending',
    };

    setFormData(newFormData);

    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleRowClick = (transfer: StockTransfer) => {
    setSelectedTransfer(transfer);
    setShowDetailModal(true);
  };

  const filteredTransfers = transfers.filter(
    (transfer) =>
      transfer.fields['Batch Number']
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const pendingTransfers = transfers.filter(
    (t) => !t.fields['Status'] || t.fields['Status'] === 'Pending'
  ).length;

  const completedTransfers = transfers.filter(
    (t) => t.fields['Status'] === 'Completed'
  ).length;

  const totalQuantity = transfers.reduce(
    (sum, t) => sum + (t.fields['Quantity Transferred'] || 0),
    0
  );

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Completed':
        return { variant: 'success' as const, icon: CheckCircle };
      case 'In Transit':
        return { variant: 'warning' as const, icon: Clock };
      case 'Cancelled':
        return { variant: 'destructive' as const, icon: XCircle };
      default:
        return { variant: 'secondary' as const, icon: Clock };
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading stock transfers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Transfer</h1>
          <p className="text-slate-500">
            Manage inter-warehouse stock transfers
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          New Transfer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pending Transfers
            </CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {pendingTransfers}
            </div>
            <p className="text-xs text-slate-500">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Completed Transfers
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {completedTransfers}
            </div>
            <p className="text-xs text-slate-500">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Quantity Transferred
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalQuantity.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Units transferred</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transfer History</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => alert('Filter options: By Status, By Warehouse, By Date Range, By Material')}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const exportData = filteredTransfers.map(t => ({
                    'Batch Number': t.fields['Batch Number'] || '-',
                    'From Warehouse': t.fields['From Warehouse']?.[0] || '-',
                    'To Warehouse': t.fields['To Warehouse']?.[0] || '-',
                    'Quantity': t.fields['Quantity Transferred'] || 0,
                    'Date': t.fields['Date'] || '-',
                    'Status': t.fields['Status'] || 'Pending',
                    'Remarks': t.fields['Remarks'] || '-',
                  }));
                  exportToCSV(exportData, 'stock_transfers');
                }}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by batch number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredTransfers.map((transfer) => {
              const statusInfo = getStatusBadge(transfer.fields['Status']);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={transfer.id}
                  onClick={() => handleRowClick(transfer)}
                  className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          {transfer.fields['Batch Number']}
                        </h3>
                        <Badge variant={statusInfo.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {transfer.fields['Status'] || 'Pending'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">From:</span>
                          <span>
                            {transfer.fields['From Warehouse']?.[0] || '-'}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        <div className="flex items-center gap-2">
                          <span className="font-medium">To:</span>
                          <span>{transfer.fields['To Warehouse']?.[0] || '-'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-slate-500">Quantity: </span>
                          <span className="font-medium text-slate-900">
                            {transfer.fields['Quantity Transferred']?.toLocaleString() ||
                              '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Date: </span>
                          <span className="text-slate-900">
                            {transfer.fields['Date']
                              ? formatDateTime(transfer.fields['Date'])
                              : '-'}
                          </span>
                        </div>
                      </div>

                      {transfer.fields['Remarks'] && (
                        <div className="mt-2 text-sm text-slate-600">
                          <span className="font-medium">Remarks: </span>
                          {transfer.fields['Remarks']}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTransfers.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-slate-500">No stock transfers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Transfer Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)}>
        <DialogContent onClose={() => setShowAddModal(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">New Transfer</DialogTitle>
            <DialogDescription>Transfer materials between warehouses</DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-0 space-y-4">
            <div>
              <Label htmlFor="material" className="text-sm font-medium text-slate-900">
                Material <span className="text-red-500">*</span>
              </Label>
              <Select
                id="material"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="mt-1"
              >
                <option value="">Select material...</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.fields['Material Name']}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromWarehouse" className="text-sm font-medium text-slate-900">
                  From <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="fromWarehouse"
                  value={formData.fromWarehouse}
                  onChange={(e) => setFormData({ ...formData, fromWarehouse: e.target.value })}
                  className="mt-1"
                >
                  <option value="">Select...</option>
                  <option value="recCBpZ8zpUu8XHBd">General</option>
                  <option value="recZ3fWphtk84bNGK">Raw Material</option>
                  <option value="rec0eZjL1jNJYpRlY">Finished Goods</option>
                  <option value="rec8JwfOxZvDrG6Jb">Oyarifa Retail</option>
                  <option value="recVhCQ6rXbqWl0zD">A-Z Bulk</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="toWarehouse" className="text-sm font-medium text-slate-900">
                  To <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="toWarehouse"
                  value={formData.toWarehouse}
                  onChange={(e) => setFormData({ ...formData, toWarehouse: e.target.value })}
                  className="mt-1"
                >
                  <option value="">Select...</option>
                  <option value="recCBpZ8zpUu8XHBd">General</option>
                  <option value="recZ3fWphtk84bNGK">Raw Material</option>
                  <option value="rec0eZjL1jNJYpRlY">Finished Goods</option>
                  <option value="rec8JwfOxZvDrG6Jb">Oyarifa Retail</option>
                  <option value="recVhCQ6rXbqWl0zD">A-Z Bulk</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium text-slate-900">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date" className="text-sm font-medium text-slate-900">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium text-slate-900">
                Status
              </Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1"
              >
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="remarks" className="text-sm font-medium text-slate-900">
                Remarks
              </Label>
              <textarea
                id="remarks"
                rows={3}
                placeholder="Add any notes..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={saving}
              className="text-slate-900 border-slate-900 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTransfer}
              disabled={!formData.material || !formData.fromWarehouse || !formData.toWarehouse || !formData.quantity || saving}
            >
              {saving ? 'Creating...' : 'Create Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <DialogContent onClose={() => setShowDetailModal(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Transfer Details</DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <div className="p-6 pt-0 space-y-4">
              <div className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{selectedTransfer.fields['Batch Number']}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedTransfer.fields['Material']?.[0] || '-'}
                    </p>
                  </div>
                  <Badge variant={getStatusBadge(selectedTransfer.fields['Status']).variant} className="text-sm">
                    {selectedTransfer.fields['Status'] || 'Pending'}
                  </Badge>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">From Warehouse</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedTransfer.fields['From Warehouse']?.[0] || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">To Warehouse</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedTransfer.fields['To Warehouse']?.[0] || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Quantity Transferred</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {(selectedTransfer.fields['Quantity Transferred'] || 0).toLocaleString()} units
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Transfer Date</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedTransfer.fields['Date']
                        ? formatDateTime(selectedTransfer.fields['Date'])
                        : '-'}
                    </span>
                  </div>
                  {selectedTransfer.fields['Remarks'] && (
                    <div className="py-3 mt-2 bg-slate-50 rounded-lg px-3">
                      <p className="text-sm font-medium text-slate-600 mb-2">Remarks</p>
                      <p className="text-sm text-slate-900">
                        {selectedTransfer.fields['Remarks']}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="text-slate-900 border-slate-900 hover:bg-slate-100"
              onClick={openEditModal}
              disabled={saving}
            >
              Edit Transfer
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTransfer}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete Transfer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transfer Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)}>
        <DialogContent onClose={() => setShowEditModal(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit Transfer</DialogTitle>
            <DialogDescription>Update transfer information</DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <>
            <div className="p-6 pt-0 space-y-4">
            <div>
              <Label htmlFor="editMaterial" className="text-sm font-medium text-slate-900">
                Material <span className="text-red-500">*</span>
              </Label>
              <Select
                id="editMaterial"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="mt-1"
              >
                <option value="">Select material...</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.fields['Material Name']}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFromWarehouse" className="text-sm font-medium text-slate-900">
                  From <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="editFromWarehouse"
                  value={formData.fromWarehouse}
                  onChange={(e) => setFormData({ ...formData, fromWarehouse: e.target.value })}
                  className="mt-1"
                >
                  <option value="">Select...</option>
                  <option value="recCBpZ8zpUu8XHBd">General</option>
                  <option value="recZ3fWphtk84bNGK">Raw Material</option>
                  <option value="rec0eZjL1jNJYpRlY">Finished Goods</option>
                  <option value="rec8JwfOxZvDrG6Jb">Oyarifa Retail</option>
                  <option value="recVhCQ6rXbqWl0zD">A-Z Bulk</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="editToWarehouse" className="text-sm font-medium text-slate-900">
                  To <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="editToWarehouse"
                  value={formData.toWarehouse}
                  onChange={(e) => setFormData({ ...formData, toWarehouse: e.target.value })}
                  className="mt-1"
                >
                  <option value="">Select...</option>
                  <option value="recCBpZ8zpUu8XHBd">General</option>
                  <option value="recZ3fWphtk84bNGK">Raw Material</option>
                  <option value="rec0eZjL1jNJYpRlY">Finished Goods</option>
                  <option value="rec8JwfOxZvDrG6Jb">Oyarifa Retail</option>
                  <option value="recVhCQ6rXbqWl0zD">A-Z Bulk</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editQuantity" className="text-sm font-medium text-slate-900">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editQuantity"
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editDate" className="text-sm font-medium text-slate-900">
                  Date
                </Label>
                <Input
                  id="editDate"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editStatus" className="text-sm font-medium text-slate-900">
                Status
              </Label>
              <Select
                id="editStatus"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1"
              >
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="editRemarks" className="text-sm font-medium text-slate-900">
                Remarks
              </Label>
              <textarea
                id="editRemarks"
                rows={3}
                placeholder="Add any notes..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={saving}
              className="text-slate-900 border-slate-900 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditTransfer}
              disabled={!formData.material || !formData.fromWarehouse || !formData.toWarehouse || !formData.quantity || saving}
            >
              {saving ? 'Updating...' : 'Update Transfer'}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
