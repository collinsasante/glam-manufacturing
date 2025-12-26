'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Filter, Download, Package, DollarSign } from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatCurrency } from '@/lib/utils';
import { exportToCSV } from '@/lib/export';
import type { RawMaterial } from '@/types';

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    materialName: '',
    specification: 'Clear',
    unit: 'Units',
    unitCost: '',
    currentStock: '',
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
  }, [formData]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const records = await tables.rawMaterials
        .select({
          maxRecords: 100,
          sort: [{ field: 'Material Name', direction: 'asc' }],
        })
        .all();

      const materialsData = records.map((record) => ({
        id: record.id,
        fields: record.fields as RawMaterial['fields'],
      }));

      setMaterials(materialsData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    try {
      setSaving(true);
      await tables.rawMaterials.create([
        {
          fields: {
            'Material Name': formData.materialName,
            'Specification': formData.specification,
            'Unit of Measurement': formData.unit,
            'Unit Cost': parseFloat(formData.unitCost) || 0,
            'Current Stock': parseFloat(formData.currentStock) || 0,
          },
        },
      ]);

      alert('Material added successfully!');
      setShowAddModal(false);
      setFormData({
        materialName: '',
        specification: 'Clear',
        unit: 'Units',
        unitCost: '',
        currentStock: '',
      });
      fetchMaterials();
    } catch (error) {
      alert('Failed to add material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMaterial = async () => {
    if (!selectedMaterial) return;

    try {
      setSaving(true);
      await tables.rawMaterials.update([
        {
          id: selectedMaterial.id,
          fields: {
            'Material Name': formData.materialName,
            'Specification': formData.specification,
            'Unit of Measurement': formData.unit,
            'Unit Cost': parseFloat(formData.unitCost) || 0,
            'Current Stock': parseFloat(formData.currentStock) || 0,
          },
        },
      ]);

      alert('Material updated successfully!');
      setShowEditModal(false);
      setShowDetailModal(false);
      setSelectedMaterial(null);
      fetchMaterials();
    } catch (error) {
      alert('Failed to update material. Please try again.');
    } finally{
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;

    if (!confirm(`Are you sure you want to delete "${selectedMaterial.fields['Material Name']}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      await tables.rawMaterials.destroy([selectedMaterial.id]);

      alert('Material deleted successfully!');
      setShowDetailModal(false);
      setSelectedMaterial(null);
      fetchMaterials();
    } catch (error) {
      alert('Failed to delete material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {

    if (!selectedMaterial) {
      return;
    }

    const newFormData = {
      materialName: selectedMaterial.fields['Material Name'],
      specification: (selectedMaterial.fields['Specification'] || 'Clear') as string,
      unit: selectedMaterial.fields['Unit of Measurement'] || 'Units',
      unitCost: String(selectedMaterial.fields['Unit Cost'] || 0),
      currentStock: String(selectedMaterial.fields['Current Stock'] || 0),
    };

    setFormData(newFormData);

    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleRowClick = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
  };

  const filteredMaterials = materials.filter((material) =>
    material.fields['Material Name']
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalValue = materials.reduce(
    (sum, m) => sum + (m.fields['Available Amount'] || 0),
    0
  );

  const totalItems = materials.length;
  const lowStockItems = materials.filter(
    (m) => (m.fields['Available Stock'] || 0) < 500
  ).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading raw materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Raw Materials</h1>
          <p className="text-slate-500">
            Manage and track all raw materials inventory
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Material
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalItems}</div>
            <p className="text-xs text-slate-500">Active materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-slate-500">Current stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{lowStockItems}</div>
            <p className="text-xs text-slate-500">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Materials</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => alert('Filter options: By Specification, By Stock Level, By Supplier, By Cost Range')}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const exportData = filteredMaterials.map(m => ({
                    'Material Name': m.fields['Material Name'],
                    'Specification': m.fields['Specification'] || '-',
                    'Unit': m.fields['Unit of Measurement'] || '-',
                    'Unit Cost': m.fields['Unit Cost'] || 0,
                    'Current Stock': m.fields['Available Stock'] || 0,
                    'Total Value': m.fields['Available Amount'] || 0,
                  }));
                  exportToCSV(exportData, 'raw_materials');
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
                placeholder="Search materials..."
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
                  <th className="pb-3">Material Name</th>
                  <th className="pb-3">Specification</th>
                  <th className="pb-3">Unit</th>
                  <th className="pb-3 text-right">Unit Cost</th>
                  <th className="pb-3 text-right">Current Stock</th>
                  <th className="pb-3 text-right">Available Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((material) => {
                  const stock = material.fields['Available Stock'] || 0;

                  return (
                    <tr
                      key={material.id}
                      onClick={() => handleRowClick(material)}
                      className="text-sm hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 font-medium text-slate-900">
                        {material.fields['Material Name']}
                      </td>
                      <td className="py-4 text-slate-600">
                        {material.fields['Specification'] || '-'}
                      </td>
                      <td className="py-4 text-slate-600">
                        {material.fields['Unit of Measurement'] || '-'}
                      </td>
                      <td className="py-4 text-right text-slate-900">
                        {material.fields['Unit Cost']
                          ? formatCurrency(material.fields['Unit Cost'])
                          : '-'}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {stock.toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {material.fields['Available Amount']
                          ? formatCurrency(material.fields['Available Amount'])
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredMaterials.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-slate-500">No materials found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Material Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)}>
        <DialogContent onClose={() => setShowAddModal(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Add New Material</DialogTitle>
            <DialogDescription>Add a raw material to your inventory</DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-0 space-y-4">
            <div>
              <Label htmlFor="materialName" className="text-sm font-medium text-slate-900">
                Material Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="materialName"
                placeholder="e.g., PET Preform 28mm"
                value={formData.materialName}
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specification" className="text-sm font-medium text-slate-900">
                  Specification
                </Label>
                <Select
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  className="mt-1"
                >
                  <option value="Clear">Clear</option>
                  <option value="Translucent">Translucent</option>
                  <option value="Color">Color</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit" className="text-sm font-medium text-slate-900">
                  Unit
                </Label>
                <Input
                  id="unit"
                  placeholder="Units, Kg, L"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="currentStock" className="text-sm font-medium text-slate-900">
                  Current Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currentStock"
                  type="number"
                  placeholder="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {formData.unitCost && formData.currentStock && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Value</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency((parseFloat(formData.currentStock) || 0) * (parseFloat(formData.unitCost) || 0))}
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
              onClick={handleAddMaterial}
              disabled={!formData.materialName || !formData.unitCost || !formData.currentStock || saving}
            >
              {saving ? 'Adding...' : 'Add Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <DialogContent onClose={() => setShowDetailModal(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Material Details</DialogTitle>
          </DialogHeader>

          {selectedMaterial && (
            <div className="p-6 pt-0 space-y-4">
              <div className="rounded-lg border border-slate-200 p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{selectedMaterial.fields['Material Name']}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedMaterial.fields['Specification'] || '-'} • {selectedMaterial.fields['Unit of Measurement'] || '-'}
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Available Stock</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {(selectedMaterial.fields['Available Stock'] || 0).toLocaleString()} {selectedMaterial.fields['Unit of Measurement'] || 'units'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Unit Cost</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(selectedMaterial.fields['Unit Cost'] || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 mt-2 bg-slate-50 rounded-lg px-3">
                    <span className="text-base font-semibold text-slate-900">Total Value</span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(selectedMaterial.fields['Available Amount'] || 0)}
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
              Edit Material
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMaterial}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Material Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)}>
        <DialogContent onClose={() => setShowEditModal(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit Material</DialogTitle>
            <DialogDescription>Update material information</DialogDescription>
          </DialogHeader>

          {selectedMaterial && (
            <>
            <div className="p-6 pt-0 space-y-4">
            <div>
              <Label htmlFor="editMaterialName" className="text-sm font-medium text-slate-900">
                Material Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editMaterialName"
                placeholder="e.g., PET Preform 28mm"
                value={formData.materialName}
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editSpecification" className="text-sm font-medium text-slate-900">
                  Specification
                </Label>
                <Select
                  id="editSpecification"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  className="mt-1"
                >
                  <option value="Clear">Clear</option>
                  <option value="Translucent">Translucent</option>
                  <option value="Color">Color</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="editUnit" className="text-sm font-medium text-slate-900">
                  Unit
                </Label>
                <Input
                  id="editUnit"
                  placeholder="Units, Kg, L"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="editCurrentStock" className="text-sm font-medium text-slate-900">
                  Current Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editCurrentStock"
                  type="number"
                  placeholder="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {formData.unitCost && formData.currentStock && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Value</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency((parseFloat(formData.currentStock) || 0) * (parseFloat(formData.unitCost) || 0))}
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
              onClick={handleEditMaterial}
              disabled={!formData.materialName || !formData.unitCost || !formData.currentStock || saving}
            >
              {saving ? 'Updating...' : 'Update Material'}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
