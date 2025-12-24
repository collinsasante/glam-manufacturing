'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Factory,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatDateTime } from '@/lib/utils';

export default function ManufacturingPage() {
  const router = useRouter();
  const [manufacturingOrders, setManufacturingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    productType: 'Standard',
    quantity: '',
    productionLine: 'Line 1',
    priority: 'Normal',
    startDate: '',
    expectedCompletion: '',
    notes: ''
  });

  useEffect(() => {
    fetchManufacturingData();
  }, []);

  const fetchManufacturingData = async () => {
    try {
      setLoading(true);
      const records = await tables.manufacturing
        .select({
          maxRecords: 50,
          sort: [{ field: 'Created on', direction: 'desc' }],
        })
        .all();

      setManufacturingOrders(records.map(r => ({ id: r.id, fields: r.fields })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    try {
      await tables.manufacturing.create({
        'Product': formData.product,
        'Product Type': formData.productType,
        'Quantity': parseInt(formData.quantity),
        'Production Line': formData.productionLine,
        'Priority': formData.priority,
        'Start Date': formData.startDate,
        'Expected Completion': formData.expectedCompletion,
        'Status': 'Pending',
        'Notes': formData.notes
      });

      // Reset form
      setFormData({
        product: '',
        productType: 'Standard',
        quantity: '',
        productionLine: 'Line 1',
        priority: 'Normal',
        startDate: '',
        expectedCompletion: '',
        notes: ''
      });
      setShowNewOrderModal(false);
      fetchManufacturingData();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading manufacturing data...</p>
        </div>
      </div>
    );
  }

  const activeOrders = manufacturingOrders.filter(o =>
    o.fields['Status'] === 'In Progress'
  ).length;
  const completedToday = manufacturingOrders.filter(o =>
    o.fields['Status'] === 'Completed'
  ).length;
  const totalOrders = manufacturingOrders.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white">
              <Factory className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manufacturing</h1>
              <p className="text-slate-500">Production lines and manufacturing orders</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/manufacturing/schedule')}>Production Schedule</Button>
          <Button onClick={() => setShowNewOrderModal(true)}>New Manufacturing Order</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Active Orders
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{activeOrders}</div>
            <p className="text-xs text-slate-500">Currently in production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{completedToday}</div>
            <p className="text-xs text-slate-500">Orders finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Orders
            </CardTitle>
            <Package className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalOrders}</div>
            <p className="text-xs text-slate-500">All manufacturing orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Production Lines
            </CardTitle>
            <Factory className="h-4 w-4 text-slate-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">3</div>
            <p className="text-xs text-slate-500">Active production lines</p>
          </CardContent>
        </Card>
      </div>

      {/* Manufacturing Flow */}
      <Card className="border-purple-600">
        <CardHeader>
          <CardTitle>Manufacturing Process Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Input from Stock Warehouse */}
            <div className="rounded-lg border-2 border-slate-300 bg-slate-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <ArrowLeft className="h-5 w-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Raw Materials In</h3>
              </div>
              <p className="text-sm text-slate-800">
                Materials received from Stock Warehouse for production
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="success">Active</Badge>
                <span className="text-xs text-slate-700">From: Stock Warehouse</span>
              </div>
            </div>

            {/* Manufacturing Process */}
            <div className="rounded-lg border-2 border-slate-300 bg-slate-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Factory className="h-5 w-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Production</h3>
              </div>
              <p className="text-sm text-slate-800">
                Active manufacturing and assembly processes
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Badge className="bg-purple-600">In Progress</Badge>
                <span className="text-xs text-slate-700">{activeOrders} orders</span>
              </div>
            </div>

            {/* Output to Finished Goods */}
            <div className="rounded-lg border-2 border-slate-300 bg-slate-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <ArrowRight className="h-5 w-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Finished Goods Out</h3>
              </div>
              <p className="text-sm text-slate-800">
                Completed products to Finished Goods Warehouse
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="success">Active</Badge>
                <span className="text-xs text-slate-700">To: FG Warehouse</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Manufacturing Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {manufacturingOrders.slice(0, 10).map((order) => {
              const getStatusConfig = (status: string) => {
                switch (status) {
                  case 'Completed':
                    return { variant: 'success' as const, icon: CheckCircle, color: 'text-slate-700' };
                  case 'In Progress':
                    return { variant: 'warning' as const, icon: PlayCircle, color: 'text-slate-700' };
                  case 'Pending':
                    return { variant: 'secondary' as const, icon: Clock, color: 'text-slate-600' };
                  case 'On Hold':
                    return { variant: 'destructive' as const, icon: PauseCircle, color: 'text-slate-700' };
                  default:
                    return { variant: 'secondary' as const, icon: Clock, color: 'text-slate-600' };
                }
              };

              const statusConfig = getStatusConfig(order.fields['Status']);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order.id}
                  className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100`}>
                          <Factory className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Order #{order.fields['Manufacturing ID'] || order.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {order.fields['Product'] || 'Manufacturing Order'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        {order.fields['Quantity'] && (
                          <div>
                            <span className="text-slate-500">Quantity: </span>
                            <span className="font-medium text-slate-900">
                              {order.fields['Quantity'].toLocaleString()}
                            </span>
                          </div>
                        )}
                        {order.fields['Production Line'] && (
                          <div>
                            <span className="text-slate-500">Line: </span>
                            <span className="font-medium text-slate-900">
                              {order.fields['Production Line']}
                            </span>
                          </div>
                        )}
                        {order.fields['Created on'] && (
                          <div>
                            <span className="text-slate-500">Created: </span>
                            <span className="text-slate-900">
                              {formatDateTime(order.fields['Created on'])}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusConfig.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.fields['Status'] || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}

            {manufacturingOrders.length === 0 && (
              <div className="py-12 text-center">
                <Factory className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No manufacturing orders found</p>
                <Button className="mt-4" onClick={() => setShowNewOrderModal(true)}>Create First Order</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewOrderModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <Factory className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">New Manufacturing Order</h2>
                    <p className="text-slate-500">Create a new production order</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="product">Product Name *</Label>
                    <Input
                      id="product"
                      placeholder="e.g., Custom Packaging Box - Medium"
                      value={formData.product}
                      onChange={(e) => setFormData({...formData, product: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productType">Product Type</Label>
                    <Select
                      id="productType"
                      value={formData.productType}
                      onChange={(e) => setFormData({...formData, productType: e.target.value})}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Custom Order">Custom Order</option>
                      <option value="Bulk Production">Bulk Production</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="1000"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productionLine">Production Line</Label>
                    <Select
                      id="productionLine"
                      value={formData.productionLine}
                      onChange={(e) => setFormData({...formData, productionLine: e.target.value})}
                    >
                      <option value="Line 1">Line 1</option>
                      <option value="Line 2">Line 2</option>
                      <option value="Line 3">Line 3</option>
                      <option value="Assembly Line">Assembly Line</option>
                      <option value="Quality Line">Quality Line</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedCompletion">Expected Completion</Label>
                    <Input
                      id="expectedCompletion"
                      type="date"
                      value={formData.expectedCompletion}
                      onChange={(e) => setFormData({...formData, expectedCompletion: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      placeholder="Additional notes or specifications..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmitOrder} className="flex-1" disabled={!formData.product || !formData.quantity}>
                    Create Order
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewOrderModal(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <Factory className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Order #{selectedOrder.fields['Manufacturing ID'] || selectedOrder.id.slice(0, 8)}
                    </h2>
                    <p className="text-slate-500">{selectedOrder.fields['Product'] || 'Manufacturing Order'}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Status</p>
                    <Badge variant={selectedOrder.fields['Status'] === 'Completed' ? 'success' : 'warning'}>
                      {selectedOrder.fields['Status'] || 'Pending'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Quantity</p>
                    <p className="font-semibold text-slate-900">{selectedOrder.fields['Quantity']?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Production Line</p>
                    <p className="font-semibold text-slate-900">{selectedOrder.fields['Production Line'] || 'Not assigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Created On</p>
                    <p className="font-semibold text-slate-900">
                      {selectedOrder.fields['Created on'] ? formatDateTime(selectedOrder.fields['Created on']) : 'N/A'}
                    </p>
                  </div>
                </div>

                {Object.keys(selectedOrder.fields).length > 0 && (
                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-900 mb-3">All Details</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedOrder.fields).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-500">{key}</span>
                          <span className="text-sm font-medium text-slate-900">
                            {value !== null && value !== undefined ? String(value) : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
