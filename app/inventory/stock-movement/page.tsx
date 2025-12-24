'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Filter, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { exportToCSV } from '@/lib/export';
import type { StockMovement, RawMaterial } from '@/types';

export default function StockMovementPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    material: '',
    transactionType: 'In',
    quantity: '',
    unitCost: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('formData changed (Stock Movement):', formData);
  }, [formData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movementRecords, materialRecords] = await Promise.all([
        tables.stockMovement
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

      const movementsData = movementRecords.map((record) => ({
        id: record.id,
        fields: record.fields as StockMovement['fields'],
      }));

      const materialsData = materialRecords.map((record) => ({
        id: record.id,
        fields: record.fields as RawMaterial['fields'],
      }));

      setMovements(movementsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async () => {
    try {
      setSaving(true);
      const totalValue = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitCost) || 0);

      await tables.stockMovement.create([
        {
          fields: {
            'Material': [formData.material],
            'Transaction Type': formData.transactionType,
            'Quantity': parseFloat(formData.quantity) || 0,
            'Unit Cost': parseFloat(formData.unitCost) || 0,
            'Total Value': totalValue,
            'Reason': formData.reason,
            'Date': formData.date,
          },
        },
      ]);

      alert('Stock movement recorded successfully!');
      setShowAddModal(false);
      setFormData({
        material: '',
        transactionType: 'In',
        quantity: '',
        unitCost: '',
        reason: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error) {
      console.error('Error adding movement:', error);
      alert('Failed to record movement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMovement = async () => {
    if (!selectedMovement) return;

    try {
      setSaving(true);
      const totalValue = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitCost) || 0);

      await tables.stockMovement.update([
        {
          id: selectedMovement.id,
          fields: {
            'Material': [formData.material],
            'Transaction Type': formData.transactionType,
            'Quantity': parseFloat(formData.quantity) || 0,
            'Unit Cost': parseFloat(formData.unitCost) || 0,
            'Total Value': totalValue,
            'Reason': formData.reason,
            'Date': formData.date,
          },
        },
      ]);

      alert('Stock movement updated successfully!');
      setShowEditModal(false);
      setShowDetailModal(false);
      setSelectedMovement(null);
      fetchData();
    } catch (error) {
      console.error('Error updating movement:', error);
      alert('Failed to update movement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMovement = async () => {
    if (!selectedMovement) return;

    if (!confirm(`Are you sure you want to delete this stock movement? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      await tables.stockMovement.destroy([selectedMovement.id]);

      alert('Stock movement deleted successfully!');
      setShowDetailModal(false);
      setSelectedMovement(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting movement:', error);
      alert('Failed to delete movement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    console.log('=== EDIT CLICKED (Stock Movement) ===');
    console.log('selectedMovement:', selectedMovement);

    if (!selectedMovement) {
      console.log('ERROR: No movement selected');
      return;
    }

    const newFormData = {
      material: selectedMovement.fields['Material']?.[0] || '',
      transactionType: selectedMovement.fields['Transaction Type'] || 'In',
      quantity: String(selectedMovement.fields['Quantity'] || 0),
      unitCost: String(selectedMovement.fields['Unit Cost'] || 0),
      reason: selectedMovement.fields['Reason'] || '',
      date: selectedMovement.fields['Date'] || new Date().toISOString().split('T')[0],
    };

    console.log('Setting formData to:', newFormData);
    setFormData(newFormData);

    console.log('Closing detail modal, opening edit modal');
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleRowClick = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setShowDetailModal(true);
  };

  const filteredMovements = movements.filter(
    (movement) =>
      movement.fields['Batch Number']
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const totalIn = movements
    .filter((m) => m.fields['Transaction Type'] === 'In')
    .reduce((sum, m) => sum + (m.fields['Total Value'] || 0), 0);

  const totalOut = movements
    .filter((m) => m.fields['Transaction Type'] === 'Out')
    .reduce((sum, m) => sum + (m.fields['Total Value'] || 0), 0);

  const netMovement = totalIn - totalOut;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading stock movements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Movement</h1>
          <p className="text-slate-500">Track all inventory movements and transactions</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          New Movement
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Stock In
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {formatCurrency(totalIn)}
            </div>
            <p className="text-xs text-slate-500">Incoming stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Stock Out
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {formatCurrency(totalOut)}
            </div>
            <p className="text-xs text-slate-500">Outgoing stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Net Movement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netMovement >= 0 ? 'text-slate-700' : 'text-slate-700'
              }`}
            >
              {formatCurrency(netMovement)}
            </div>
            <p className="text-xs text-slate-500">
              {movements.length} total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Movement History</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => alert('Filter options: By Type, By Material, By Date Range')}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const exportData = filteredMovements.map(m => ({
                    'Batch Number': m.fields['Batch Number'] || '-',
                    'Date': m.fields['Date'] || '-',
                    'Type': m.fields['Transaction Type'] || '-',
                    'Reason': m.fields['Reason'] || '-',
                    'Quantity': m.fields['Quantity'] || 0,
                    'Unit Cost': m.fields['Unit Cost'] || 0,
                    'Total Value': m.fields['Total Value'] || 0,
                  }));
                  exportToCSV(exportData, 'stock_movements');
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-medium text-slate-600">
                  <th className="pb-3">Batch Number</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3 text-right">Quantity</th>
                  <th className="pb-3 text-right">Unit Cost</th>
                  <th className="pb-3 text-right">Total Value</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMovements.map((movement) => {
                  const isIncoming = movement.fields['Transaction Type'] === 'In';

                  return (
                    <tr
                      key={movement.id}
                      onClick={() => handleRowClick(movement)}
                      className="text-sm hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 font-medium text-slate-900">
                        {movement.fields['Batch Number']}
                      </td>
                      <td className="py-4 text-slate-600">
                        {movement.fields['Date']
                          ? formatDateTime(movement.fields['Date'])
                          : '-'}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {isIncoming ? (
                            <TrendingUp className="h-4 w-4 text-slate-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={
                              isIncoming ? 'text-slate-700' : 'text-slate-700'
                            }
                          >
                            {movement.fields['Transaction Type']}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">
                        {movement.fields['Reason'] || '-'}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {movement.fields['Quantity']?.toLocaleString() || '-'}
                      </td>
                      <td className="py-4 text-right text-slate-600">
                        {movement.fields['Unit Cost']
                          ? formatCurrency(movement.fields['Unit Cost'])
                          : '-'}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {movement.fields['Total Value']
                          ? formatCurrency(movement.fields['Total Value'])
                          : '-'}
                      </td>
                      <td className="py-4">
                        <Badge variant={isIncoming ? 'success' : 'secondary'}>
                          {isIncoming ? 'Received' : 'Issued'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredMovements.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-slate-500">No stock movements found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Movement Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)}>
        <DialogContent onClose={() => setShowAddModal(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">New Stock Movement</DialogTitle>
            <DialogDescription>Record a new inventory movement</DialogDescription>
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

            <div>
              <Label htmlFor="transactionType" className="text-sm font-medium text-slate-900">
                Transaction Type <span className="text-red-500">*</span>
              </Label>
              <Select
                id="transactionType"
                value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                className="mt-1"
              >
                <option value="In">In (Received)</option>
                <option value="Out">Out (Issued)</option>
              </Select>
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
                <Label htmlFor="unitCost" className="text-sm font-medium text-slate-900">
                  Unit Cost (GHS) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason" className="text-sm font-medium text-slate-900">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reason"
                placeholder="e.g., Purchase, Sale, Return, Adjustment"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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

            {formData.quantity && formData.unitCost && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Value</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitCost) || 0))}
                  </span>
                </div>
              </div>
            )}
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
              onClick={handleAddMovement}
              disabled={!formData.material || !formData.quantity || !formData.unitCost || !formData.reason || saving}
            >
              {saving ? 'Recording...' : 'Record Movement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <DialogContent onClose={() => setShowDetailModal(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Movement Details</DialogTitle>
          </DialogHeader>

          {selectedMovement && (
            <div className="p-6 pt-0 space-y-4">
              <div className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{selectedMovement.fields['Batch Number']}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedMovement.fields['Material']?.[0] || '-'}
                    </p>
                  </div>
                  <Badge
                    variant={selectedMovement.fields['Transaction Type'] === 'In' ? 'success' : 'secondary'}
                    className="text-sm"
                  >
                    {selectedMovement.fields['Transaction Type'] === 'In' ? 'Received' : 'Issued'}
                  </Badge>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Transaction Type</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMovement.fields['Transaction Type']}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Quantity</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMovement.fields['Quantity']?.toLocaleString() || '-'} units
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Unit Cost</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(selectedMovement.fields['Unit Cost'] || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Reason</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMovement.fields['Reason'] || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Date</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMovement.fields['Date']
                        ? formatDateTime(selectedMovement.fields['Date'])
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 mt-2 bg-slate-50 rounded-lg px-3">
                    <span className="text-base font-semibold text-slate-900">Total Value</span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(selectedMovement.fields['Total Value'] || 0)}
                    </span>
                  </div>
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
              Edit Movement
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMovement}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete Movement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Movement Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)}>
        <DialogContent onClose={() => setShowEditModal(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit Stock Movement</DialogTitle>
            <DialogDescription>Update movement information</DialogDescription>
          </DialogHeader>

          {selectedMovement && (
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

            <div>
              <Label htmlFor="editTransactionType" className="text-sm font-medium text-slate-900">
                Transaction Type <span className="text-red-500">*</span>
              </Label>
              <Select
                id="editTransactionType"
                value={formData.transactionType}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                className="mt-1"
              >
                <option value="In">In (Received)</option>
                <option value="Out">Out (Issued)</option>
              </Select>
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
                <Label htmlFor="editUnitCost" className="text-sm font-medium text-slate-900">
                  Unit Cost (GHS) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editUnitCost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editReason" className="text-sm font-medium text-slate-900">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editReason"
                placeholder="e.g., Purchase, Sale, Return, Adjustment"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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

            {formData.quantity && formData.unitCost && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Value</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency((parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitCost) || 0))}
                  </span>
                </div>
              </div>
            )}
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
              onClick={handleEditMovement}
              disabled={!formData.material || !formData.quantity || !formData.unitCost || !formData.reason || saving}
            >
              {saving ? 'Updating...' : 'Update Movement'}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
