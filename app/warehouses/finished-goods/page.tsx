'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PackageCheck, TrendingUp, MapPin, User, Phone, Search } from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatCurrency } from '@/lib/utils';
import type { FinishedGood } from '@/types';
import { useRouter } from 'next/navigation';

export default function FinishedGoodsWarehousePage() {
  const router = useRouter();
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [warehouse, setWarehouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<Map<string, string>>(new Map());
  const [selectedProduct, setSelectedProduct] = useState<FinishedGood | null>(null);
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

      const [productRecords, warehouseRecords] = await Promise.all([
        tables.finishedGoodsWarehouse.select({ maxRecords: 100 }).all(),
        tables.finishedGoodsWarehouse.select().all(),
      ]);

      setProducts(productRecords.map(r => ({ id: r.id, fields: r.fields as FinishedGood['fields'] })));
      if (warehouseRecords.length > 0) {
        setWarehouse({ id: warehouseRecords[0].id, fields: warehouseRecords[0].fields });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (product: FinishedGood) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading finished goods...</p>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(p =>
    p.fields['Product Name']?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableProducts = products.filter(p => p.fields['Status'] === 'Available').length;
  const totalProducts = products.length;
  const outOfStockProducts = products.filter(p => p.fields['Status'] === 'Out of Stock').length;
  const totalValue = products.reduce((sum, p) =>
    sum + ((p.fields['Available Quantity'] || 0) * (p.fields['Price'] || 0)), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-600 text-white">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Finished Goods Warehouse</h1>
              <p className="text-slate-500">Ready-to-ship product storage</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/reports')}>
            Inventory Report
          </Button>
          <Button onClick={() => router.push('/inventory/finished-goods')}>
            Add Product
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
                  {warehouse?.fields['Address'] || 'Finished Goods Storage'}
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
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalProducts}</div>
            <p className="text-xs text-slate-500">Product types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Available Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{availableProducts}</div>
            <p className="text-xs text-slate-500">Ready to ship</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{outOfStockProducts}</div>
            <p className="text-xs text-slate-500">Needs replenishment</p>
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
            <p className="text-xs text-slate-500">Inventory worth</p>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Finished Products Inventory</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-medium text-slate-600">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Pack Size/Notes</th>
                  <th className="pb-3 text-right">Available Qty</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const qty = product.fields['Available Quantity'] || 0;
                  const price = product.fields['Price'] || 0;
                  const totalValue = qty * price;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => handleRowClick(product)}
                      className="text-sm hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 font-medium text-slate-900">
                        {product.fields['Product Name']}
                      </td>
                      <td className="py-4 text-slate-600 text-xs">
                        {product.fields['Pack Size/Notes'] || '-'}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {qty.toLocaleString()}
                      </td>
                      <td className="py-4 text-right text-slate-600">
                        {formatCurrency(price)}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {formatCurrency(totalValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-slate-500">No products found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <DialogContent onClose={() => setShowDetailModal(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Product Details</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="p-6 pt-0 space-y-4">
              <div className="rounded-lg border border-slate-200 p-5">
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedProduct.fields['Product Name']}
                  </h3>
                  <Badge
                    variant={
                      selectedProduct.fields['Status'] === 'Available'
                        ? 'success'
                        : selectedProduct.fields['Status'] === 'Out of Stock'
                        ? 'destructive'
                        : selectedProduct.fields['Status'] === 'Reserved'
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {selectedProduct.fields['Status'] || 'Unknown'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Pack Size / Notes</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedProduct.fields['Pack Size/Notes'] || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Available Quantity</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {(selectedProduct.fields['Available Quantity'] || 0).toLocaleString()} units
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Unit Price</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(selectedProduct.fields['Price'] || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 mt-2 bg-slate-100 rounded-lg px-3">
                    <span className="text-base font-semibold text-slate-900">Total Value</span>
                    <span className="text-xl font-bold text-slate-700">
                      {formatCurrency(
                        (selectedProduct.fields['Available Quantity'] || 0) *
                        (selectedProduct.fields['Price'] || 0)
                      )}
                    </span>
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
