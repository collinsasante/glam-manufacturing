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
  Truck,
  Bike,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Package,
  Navigation,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatDateTime } from '@/lib/utils';

export default function DeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    customerContact: '',
    deliveryAddress: '',
    deliveryMethod: 'Bike',
    rider: '',
    totalItems: '',
    date: '',
    timeSlot: 'Morning',
    priority: 'Normal',
    deliveryFee: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchDeliveriesData();
  }, []);

  const fetchDeliveriesData = async () => {
    try {
      setLoading(true);

      const [deliveryRecords, riderRecords] = await Promise.all([
        tables.deliveries.select({ maxRecords: 50 }).all(),
        tables.riders.select({ maxRecords: 20 }).all(),
      ]);

      setDeliveries(deliveryRecords.map(r => ({ id: r.id, fields: r.fields })));
      setRiders(riderRecords.map(r => ({ id: r.id, fields: r.fields })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDelivery = async () => {
    try {
      await tables.deliveries.create({
        'Customer': formData.customer,
        'Customer Contact': formData.customerContact,
        'Delivery Address': formData.deliveryAddress,
        'Delivery Method': formData.deliveryMethod,
        'Total Items': formData.totalItems ? parseInt(formData.totalItems) : undefined,
        'Date': formData.date,
        'Time Slot': formData.timeSlot,
        'Priority': formData.priority,
        'Status': 'Pending',
        'Delivery Fee': formData.deliveryFee ? parseFloat(formData.deliveryFee) : undefined,
        'Payment Method': formData.paymentMethod,
        'Notes': formData.notes
      });

      // Reset form
      setFormData({
        customer: '',
        customerContact: '',
        deliveryAddress: '',
        deliveryMethod: 'Bike',
        rider: '',
        totalItems: '',
        date: '',
        timeSlot: 'Morning',
        priority: 'Normal',
        deliveryFee: '',
        paymentMethod: 'Cash',
        notes: ''
      });
      setShowNewDeliveryModal(false);
      fetchDeliveriesData();
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert('Failed to schedule delivery. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  const pendingDeliveries = deliveries.filter(d => d.fields['Status'] === 'Pending').length;
  const inProgressDeliveries = deliveries.filter(d => d.fields['Status'] === 'In Progress').length;
  const completedDeliveries = deliveries.filter(d => d.fields['Status'] === 'Completed').length;
  const activeRiders = riders.filter(r => r.fields['Status'] === 'Active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-600 text-white">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Deliveries</h1>
              <p className="text-slate-500">Manage and track all delivery operations</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/reports')}>Delivery Routes</Button>
          <Button onClick={() => setShowNewDeliveryModal(true)}>Schedule Delivery</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pending Deliveries
            </CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{pendingDeliveries}</div>
            <p className="text-xs text-slate-500">Awaiting dispatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              In Progress
            </CardTitle>
            <Navigation className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">{inProgressDeliveries}</div>
            <p className="text-xs text-slate-500">Out for delivery</p>
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
            <div className="text-2xl font-bold text-slate-700">{completedDeliveries}</div>
            <p className="text-xs text-slate-500">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Active Riders
            </CardTitle>
            <Users className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeRiders}</div>
            <p className="text-xs text-slate-500">On duty</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deliveries.slice(0, 10).map((delivery) => {
              const getStatusConfig = (status: string) => {
                switch (status) {
                  case 'Completed':
                    return { variant: 'success' as const, icon: CheckCircle, color: 'bg-slate-100' };
                  case 'In Progress':
                    return { variant: 'warning' as const, icon: Navigation, color: 'bg-slate-100' };
                  case 'Pending':
                    return { variant: 'secondary' as const, icon: Clock, color: 'bg-slate-100' };
                  case 'Cancelled':
                    return { variant: 'destructive' as const, icon: XCircle, color: 'bg-slate-100' };
                  default:
                    return { variant: 'secondary' as const, icon: Clock, color: 'bg-slate-50' };
                }
              };

              const statusConfig = getStatusConfig(delivery.fields['Status']);
              const StatusIcon = statusConfig.icon;

              const isExpanded = expandedDeliveryId === delivery.id;

              return (
                <div
                  key={delivery.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 hover:shadow-md transition-all overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedDeliveryId(isExpanded ? null : delivery.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                            <Truck className="h-5 w-5 text-slate-700" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              Delivery #{delivery.fields['Delivery ID'] || delivery.id.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {delivery.fields['Customer'] || 'Customer Order'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          {delivery.fields['Total Stops'] && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">
                                {delivery.fields['Total Stops']} stops
                              </span>
                            </div>
                          )}
                          {delivery.fields['Rider'] && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">
                                {delivery.fields['Rider']}
                              </span>
                            </div>
                          )}
                          {delivery.fields['Date'] && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">
                                {formatDateTime(delivery.fields['Date'])}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={statusConfig.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {delivery.fields['Status'] || 'Pending'}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-slate-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-white p-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Delivery Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {Object.entries(delivery.fields).map(([key, value]: [string, any]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-slate-500">{key}</p>
                            <p className="font-medium text-slate-900">
                              {value !== null && value !== undefined ? String(value) : 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/deliveries/track/${delivery.id}`);
                        }}>
                          Track Delivery
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDeliveryId(null);
                        }}>
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {deliveries.length === 0 && (
              <div className="py-12 text-center">
                <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No deliveries scheduled</p>
                <Button className="mt-4" onClick={() => setShowNewDeliveryModal(true)}>Schedule First Delivery</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Delivery Modal */}
      {showNewDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewDeliveryModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <Truck className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Schedule Delivery</h2>
                    <p className="text-slate-500">Create a new delivery order</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="customer">Customer Name *</Label>
                    <Input
                      id="customer"
                      placeholder="ABC Retail Store"
                      value={formData.customer}
                      onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerContact">Contact Number</Label>
                    <Input
                      id="customerContact"
                      type="tel"
                      placeholder="+233 XX XXX XXXX"
                      value={formData.customerContact}
                      onChange={(e) => setFormData({...formData, customerContact: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryMethod">Delivery Method</Label>
                    <Select
                      id="deliveryMethod"
                      value={formData.deliveryMethod}
                      onChange={(e) => setFormData({...formData, deliveryMethod: e.target.value})}
                    >
                      <option value="Bike">Bike</option>
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                      <option value="3rd Party Courier">3rd Party Courier</option>
                      <option value="Customer Pickup">Customer Pickup</option>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <textarea
                      id="deliveryAddress"
                      rows={2}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      placeholder="123 Oxford Street, Accra"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Delivery Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeSlot">Time Slot</Label>
                    <Select
                      id="timeSlot"
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                    >
                      <option value="Morning (8AM-12PM)">Morning (8AM-12PM)</option>
                      <option value="Afternoon (12PM-4PM)">Afternoon (12PM-4PM)</option>
                      <option value="Evening (4PM-8PM)">Evening (4PM-8PM)</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalItems">Total Items</Label>
                    <Input
                      id="totalItems"
                      type="number"
                      placeholder="25"
                      value={formData.totalItems}
                      onChange={(e) => setFormData({...formData, totalItems: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryFee">Delivery Fee (GHS)</Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      value={formData.deliveryFee}
                      onChange={(e) => setFormData({...formData, deliveryFee: e.target.value})}
                    />
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
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Mobile Money">Mobile Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Prepaid">Prepaid</option>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Delivery Notes</Label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      placeholder="Special delivery instructions..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmitDelivery} className="flex-1" disabled={!formData.customer || !formData.deliveryAddress || !formData.date}>
                    Schedule Delivery
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewDeliveryModal(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Riders */}
      {riders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Riders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {riders.slice(0, 8).map((rider) => (
                <div key={rider.id} className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600 text-white font-semibold">
                      {(rider.fields['Name'] || 'R')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {rider.fields['Name'] || 'Rider'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rider.fields['Phone'] || 'No phone'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant={rider.fields['Status'] === 'Active' ? 'success' : 'secondary'} className="text-xs">
                      {rider.fields['Status'] || 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
