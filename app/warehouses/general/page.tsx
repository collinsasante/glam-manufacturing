'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Phone,
  User,
  MapPin,
} from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatCurrency } from '@/lib/utils';
import type { Warehouse } from '@/types';
import { useRouter } from 'next/navigation';

export default function GeneralWarehousePage() {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<Map<string, string>>(new Map());
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      setLoading(true);

      // Fetch team members first
      const teamRecords = await tables.teamMembers.select().all();
      const teamMap = new Map(
        teamRecords.map(r => [r.id, r.fields['Name'] as string])
      );
      setTeamMembers(teamMap);

      // Fetch warehouse info
      const warehouseRecords = await tables.generalWarehouse.select().all();
      if (warehouseRecords.length > 0) {
        setWarehouse({
          id: warehouseRecords[0].id,
          fields: warehouseRecords[0].fields as Warehouse['fields'],
        });
      }

      // Fetch related materials
      const materialRecords = await tables.rawMaterials
        .select({ maxRecords: 50 })
        .all();

      setMaterials(materialRecords.map(r => ({
        id: r.id,
        fields: r.fields,
      })));
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
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

  const totalIn = warehouse?.fields['Total In'] || 0;
  const totalOut = warehouse?.fields['Total Out'] || 0;
  const availableQty = warehouse?.fields['Available Quantity'] || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700 text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">General Warehouse</h1>
              <p className="text-slate-500">Central distribution hub</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/inventory/stock-movement')}>
            View History
          </Button>
          <Button onClick={() => router.push('/inventory/stock-transfer')}>
            New Transfer
          </Button>
        </div>
      </div>

      {/* Warehouse Info Card */}
      <Card className="border-slate-300">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
                <MapPin className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium text-slate-900">
                  {warehouse?.fields['Address'] || 'Not specified'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
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

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Available Quantity
            </CardTitle>
            <Package className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {availableQty.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Units in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Stock In
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {totalIn.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Incoming units</p>
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
              {totalOut.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Outgoing units</p>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Flow Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Incoming from Suppliers */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <Package className="h-6 w-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Incoming from Suppliers</h3>
                  <p className="text-sm text-slate-500">Raw materials received from suppliers</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>

            {/* To Manufacturing */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <ArrowRight className="h-6 w-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">To Manufacturing</h3>
                  <p className="text-sm text-slate-500">Materials sent to production lines</p>
                </div>
                <Badge variant="warning">In Progress</Badge>
              </div>
            </div>

            {/* To Finished Goods Warehouse */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <ArrowRight className="h-6 w-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">To Finished Goods Warehouse</h3>
                  <p className="text-sm text-slate-500">Completed products storage</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>

            {/* To Retail Locations */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <ArrowRight className="h-6 w-6 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">To Proxy Warehouse (Retail, Oyarifa)</h3>
                  <p className="text-sm text-slate-500">Distribution to retail locations</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-medium text-slate-600">
                  <th className="pb-3">Material</th>
                  <th className="pb-3">Specification</th>
                  <th className="pb-3 text-right">Stock Level</th>
                  <th className="pb-3 text-right">Unit Cost</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.slice(0, 10).map((material) => {
                  const stock = material.fields['Available Stock'] || 0;
                  const isLowStock = stock < 500;

                  return (
                    <tr
                      key={material.id}
                      onClick={() => handleRowClick(material)}
                      className="text-sm hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-medium text-slate-900">
                        {material.fields['Material Name']}
                      </td>
                      <td className="py-3 text-slate-600">
                        {material.fields['Specification'] || '-'}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-900">
                        {stock.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-slate-600">
                        {material.fields['Unit Cost']
                          ? formatCurrency(material.fields['Unit Cost'])
                          : '-'}
                      </td>
                      <td className="py-3">
                        <Badge variant={isLowStock ? 'warning' : 'success'}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                    <span className="text-sm font-medium text-slate-600">Unit Cost</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedMaterial.fields['Unit Cost']
                        ? formatCurrency(selectedMaterial.fields['Unit Cost'])
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Status</span>
                    <Badge variant={(selectedMaterial.fields['Available Stock'] || 0) < 500 ? 'warning' : 'success'}>
                      {(selectedMaterial.fields['Available Stock'] || 0) < 500 ? 'Low Stock' : 'In Stock'}
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
