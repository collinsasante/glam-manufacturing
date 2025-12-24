'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatCurrency } from '@/lib/utils';
import { exportToCSV } from '@/lib/export';
import type { FinishedGood } from '@/types';

export default function FinishedGoodsPage() {
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FinishedGood | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    productName: '',
    packSize: '',
    availableQty: '',
    price: '',
    status: 'Available' as 'Available' | 'Out of Stock' | 'Reserved' | 'Pending',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('formData changed:', formData);
  }, [formData]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const records = await tables.finishedGoodsWarehouse
        .select({
          maxRecords: 100,
          sort: [{ field: 'Product Name', direction: 'asc' }],
        })
        .all();

      const productsData = records.map((record) => ({
        id: record.id,
        fields: record.fields as FinishedGood['fields'],
      }));

      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      setSaving(true);
      await tables.finishedGoodsWarehouse.create([
        {
          fields: {
            'Product Name': formData.productName,
            'Pack Size/Notes': formData.packSize,
            'Available Quantity': parseFloat(formData.availableQty) || 0,
            'Price': parseFloat(formData.price) || 0,
            'Status': formData.status,
          },
        },
      ]);

      alert('Product added successfully!');
      setShowAddModal(false);
      setFormData({
        productName: '',
        packSize: '',
        availableQty: '',
        price: '',
        status: 'Available',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      await tables.finishedGoodsWarehouse.update([
        {
          id: selectedProduct.id,
          fields: {
            'Product Name': formData.productName,
            'Pack Size/Notes': formData.packSize,
            'Available Quantity': parseFloat(formData.availableQty) || 0,
            'Price': parseFloat(formData.price) || 0,
            'Status': formData.status,
          },
        },
      ]);

      alert('Product updated successfully!');
      setShowEditModal(false);
      setShowDetailModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    if (!confirm(`Are you sure you want to delete "${selectedProduct.fields['Product Name']}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      await tables.finishedGoodsWarehouse.destroy([selectedProduct.id]);

      alert('Product deleted successfully!');
      setShowDetailModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    console.log('=== EDIT CLICKED ===');
    console.log('selectedProduct:', selectedProduct);

    if (!selectedProduct) {
      console.log('ERROR: No product selected');
      return;
    }

    const newFormData = {
      productName: selectedProduct.fields['Product Name'],
      packSize: selectedProduct.fields['Pack Size/Notes'] || '',
      availableQty: String(selectedProduct.fields['Available Quantity'] || 0),
      price: String(selectedProduct.fields['Price'] || 0),
      status: (selectedProduct.fields['Status'] || 'Available') as 'Available' | 'Out of Stock' | 'Reserved' | 'Pending',
    };

    console.log('Setting formData to:', newFormData);
    setFormData(newFormData);

    console.log('Closing detail modal, opening edit modal');
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleRowClick = (product: FinishedGood) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const filteredProducts = products.filter((product) =>
    product.fields['Product Name']
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalValue = products.reduce(
    (sum, p) =>
      sum + (p.fields['Available Quantity'] || 0) * (p.fields['Price'] || 0),
    0
  );

  const totalItems = products.length;
  const outOfStockItems = products.filter((p) => (p.fields['Available Quantity'] || 0) === 0).length;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Finished Goods</h1>
          <p className="text-slate-500">
            Manage your finished products inventory
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalItems}</div>
            <p className="text-xs text-slate-500">Active products</p>
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
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{outOfStockItems}</div>
            <p className="text-xs text-slate-500">Require restocking</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Products</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => alert('Filter options: By Status, By Price Range, By Pack Size')}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const exportData = filteredProducts.map(p => ({
                    'Product Name': p.fields['Product Name'],
                    'Pack Size': p.fields['Pack Size/Notes'] || '-',
                    'Available Quantity': p.fields['Available Quantity'] || 0,
                    'Price': p.fields['Price'] || 0,
                    'Total Value': (p.fields['Available Quantity'] || 0) * (p.fields['Price'] || 0),
                    'Status': p.fields['Status'] || 'Available',
                  }));
                  exportToCSV(exportData, 'finished_goods');
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
                placeholder="Search products..."
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
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Pack Size / Notes</th>
                  <th className="pb-3 text-right">Available Qty</th>
                  <th className="pb-3 text-right">Unit Price</th>
                  <th className="pb-3 text-right">Total Value</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const qty = product.fields['Available Quantity'] || 0;
                  const price = product.fields['Price'] || 0;
                  const status = product.fields['Status'] || 'Available';

                  const statusColors = {
                    'Available': 'bg-slate-200 text-slate-900',
                    'Out of Stock': 'bg-red-100 text-red-800',
                    'Reserved': 'bg-slate-200 text-slate-900',
                    'Pending': 'bg-slate-200 text-slate-900',
                  };

                  return (
                    <tr
                      key={product.id}
                      onClick={() => handleRowClick(product)}
                      className="text-sm hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 font-medium text-slate-900">
                        {product.fields['Product Name']}
                      </td>
                      <td className="py-4 text-slate-600">
                        {product.fields['Pack Size/Notes'] || '-'}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {qty.toLocaleString()}
                      </td>
                      <td className="py-4 text-right text-slate-900">
                        {formatCurrency(price)}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {formatCurrency(qty * price)}
                      </td>
                      <td className="py-4">
                        <Badge className={statusColors[status as keyof typeof statusColors]}>
                          {status}
                        </Badge>
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

      {/* Add Product Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)}>
        <DialogContent onClose={() => setShowAddModal(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Add New Product</DialogTitle>
            <DialogDescription>Add a finished goods product to your inventory</DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-0 space-y-4">
            <div>
              <Label htmlFor="productName" className="text-sm font-medium text-slate-900">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                placeholder="Product name"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="packSize" className="text-sm font-medium text-slate-900">
                Pack Size / Notes
              </Label>
              <Input
                id="packSize"
                placeholder="Optional"
                value={formData.packSize}
                onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="availableQty" className="text-sm font-medium text-slate-900">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="availableQty"
                  type="number"
                  placeholder="0"
                  value={formData.availableQty}
                  onChange={(e) => setFormData({ ...formData, availableQty: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-sm font-medium text-slate-900">
                  Price (GHS) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                className="mt-1"
              >
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Reserved">Reserved</option>
                <option value="Pending">Pending</option>
              </Select>
            </div>

            {formData.availableQty && formData.price && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Value</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency((parseFloat(formData.availableQty) || 0) * (parseFloat(formData.price) || 0))}
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
              onClick={handleAddProduct}
              disabled={!formData.productName || !formData.availableQty || !formData.price || saving}
            >
              {saving ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedProduct.fields['Product Name']}</h3>
                    {selectedProduct.fields['Pack Size/Notes'] && (
                      <p className="text-sm text-slate-500 mt-1">{selectedProduct.fields['Pack Size/Notes']}</p>
                    )}
                  </div>
                  <Badge className={{
                    'Available': 'bg-slate-200 text-slate-900',
                    'Out of Stock': 'bg-red-100 text-red-800',
                    'Reserved': 'bg-slate-200 text-slate-900',
                    'Pending': 'bg-slate-200 text-slate-900',
                  }[selectedProduct.fields['Status'] || 'Available']}>
                    {selectedProduct.fields['Status'] || 'Available'}
                  </Badge>
                </div>

                <div className="space-y-3 mt-4">
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
                  <div className="flex justify-between py-3 mt-2 bg-slate-50 rounded-lg px-3">
                    <span className="text-base font-semibold text-slate-900">Total Value</span>
                    <span className="text-xl font-bold text-slate-900">
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
              className="text-slate-900 border-slate-900 hover:bg-slate-100"
              onClick={openEditModal}
              disabled={saving}
            >
              Edit Product
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)}>
        <DialogContent onClose={() => setShowEditModal(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <>
            <div className="p-6 pt-0 space-y-4">
            <div>
              <Label htmlFor="editProductName" className="text-sm font-medium text-slate-900">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="editProductName"
                placeholder="Product name"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="mt-1"
                key={`product-name-${selectedProduct?.id}`}
              />
            </div>

            <div>
              <Label htmlFor="editPackSize" className="text-sm font-medium text-slate-900">
                Pack Size / Notes
              </Label>
              <Input
                id="editPackSize"
                placeholder="Optional"
                value={formData.packSize}
                onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editAvailableQty" className="text-sm font-medium text-slate-900">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editAvailableQty"
                  type="number"
                  placeholder="0"
                  value={formData.availableQty}
                  onChange={(e) => setFormData({ ...formData, availableQty: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editPrice" className="text-sm font-medium text-slate-900">
                  Price (GHS) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="editPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                className="mt-1"
              >
                <option value="Available">Available</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Reserved">Reserved</option>
                <option value="Pending">Pending</option>
              </Select>
            </div>

            {formData.availableQty && formData.price && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Value</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency((parseFloat(formData.availableQty) || 0) * (parseFloat(formData.price) || 0))}
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
              onClick={handleEditProduct}
              disabled={!formData.productName || !formData.availableQty || !formData.price || saving}
            >
              {saving ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
