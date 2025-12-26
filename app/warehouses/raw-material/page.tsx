'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, TrendingUp, AlertTriangle, MapPin, User, Phone } from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function RawMaterialWarehousePage() {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<Map<string, string>>(new Map());
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch team members first
      const teamRecords = await tables.teamMembers.select().all();
      const teamMap = new Map(
        teamRecords.map(r => [r.id, r.fields['Name'] as string])
      );
      setTeamMembers(teamMap);

      const warehouseRecords = await tables.rawMaterialWarehouse.select().all();
      if (warehouseRecords.length > 0) {
        setWarehouse({
          id: warehouseRecords[0].id,
          fields: warehouseRecords[0].fields,
        });
      }

      const materialRecords = await tables.rawMaterials
        .select({ maxRecords: 100 })
        .all();
      setMaterials(materialRecords.map(r => ({ id: r.id, fields: r.fields })));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (material: any) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading warehouse data...</p>
        </div>
      </div>
    );
  }

  const availableQty = warehouse?.fields['Available Quantity'] || 0;
  const totalMaterials = materials.length;
  const lowStockCount = materials.filter(m => (m.fields['Available Stock'] || 0) < 500).length;
  const totalValue = materials.reduce((sum, m) => sum + (m.fields['Available Amount'] || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-600 text-white">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Raw Material Warehouse</h1>
              <p className="text-slate-500">Primary raw materials storage facility</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/inventory/stock-movement')}>
            Stock Report
          </Button>
          <Button onClick={() => router.push('/inventory/raw-materials')}>
            Receive Materials
          </Button>
        </div>
      </div>

      {/* Warehouse Info */}
      <Card className="border-slate-400">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <MapPin className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium text-slate-900">
                  {warehouse?.fields['Address'] || 'Main Storage Facility'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <User className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Officer in Charge</p>
                <p className="font-medium text-slate-900">
                  {warehouse?.fields['Officer in Charge']
                    ? teamMembers.get(warehouse.fields['Officer in Charge'] as string) || 'Not assigned'
                    : 'Not assigned'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Phone className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Contact</p>
                <p className="font-medium text-slate-900">
                  {warehouse?.fields['Phone Number'] || 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Available Quantity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {availableQty.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Units in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalMaterials}</div>
            <p className="text-xs text-slate-500">Different materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-slate-500">Inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{lowStockCount}</div>
            <p className="text-xs text-slate-500">Items below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Materials by Category */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Raw Materials Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm font-medium text-slate-600">
                    <th className="pb-3">Material</th>
                    <th className="pb-3">Spec</th>
                    <th className="pb-3 text-right">Stock</th>
                    <th className="pb-3 text-right">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.slice(0, 15).map((material) => {
                    const stock = material.fields['Available Stock'] || 0;
                    const isLowStock = stock < 500;
                    const isOutOfStock = stock === 0;

                    return (
                      <tr
                        key={material.id}
                        onClick={() => handleRowClick(material)}
                        className="text-sm hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 font-medium text-slate-900">
                          {material.fields['Material Name']}
                        </td>
                        <td className="py-3 text-slate-600 text-xs">
                          {material.fields['Specification'] || '-'}
                        </td>
                        <td className="py-3 text-right font-medium text-slate-900">
                          {stock.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-slate-600 text-xs">
                          {material.fields['Unit Cost']
                            ? formatCurrency(material.fields['Unit Cost'])
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-slate-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materials
                .filter(m => (m.fields['Available Stock'] || 0) < 500)
                .slice(0, 5)
                .map((material, index) => (
                  <div key={index} className="rounded-lg border border-slate-300 bg-slate-100 p-3">
                    <p className="font-medium text-slate-900 text-sm">
                      {material.fields['Material Name']}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        Stock: {(material.fields['Available Stock'] || 0).toLocaleString()}
                      </span>
                      <Badge variant="warning" className="text-xs">Low</Badge>
                    </div>
                  </div>
                ))}
              {lowStockCount === 0 && (
                <p className="text-center text-sm text-slate-500 py-8">
                  All materials are well stocked
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material Detail Modal */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <DialogContent onClose={() => setShowDetailModal(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Material Details</DialogTitle>
          </DialogHeader>

          {selectedMaterial && (
            <div className="p-6 pt-0 space-y-4">
              <div className="rounded-lg border border-slate-200 p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {selectedMaterial.fields['Material Name']}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Specification</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMaterial.fields['Specification'] || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Available Stock</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {(selectedMaterial.fields['Available Stock'] || 0).toLocaleString()} units
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Unit of Measurement</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMaterial.fields['Unit of Measurement'] || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Unit Cost</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMaterial.fields['Unit Cost']
                        ? formatCurrency(selectedMaterial.fields['Unit Cost'])
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Total Amount</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMaterial.fields['Available Amount']
                        ? formatCurrency(selectedMaterial.fields['Available Amount'])
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm font-medium text-slate-600">Status</span>
                    <Badge variant={
                      (selectedMaterial.fields['Available Stock'] || 0) === 0
                        ? 'destructive'
                        : (selectedMaterial.fields['Available Stock'] || 0) < 500
                        ? 'warning'
                        : 'success'
                    }>
                      {(selectedMaterial.fields['Available Stock'] || 0) === 0
                        ? 'Out of Stock'
                        : (selectedMaterial.fields['Available Stock'] || 0) < 500
                        ? 'Low Stock'
                        : 'In Stock'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
              className="text-slate-900 border-slate-900 hover:bg-slate-100"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
