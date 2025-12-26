'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, User, Clock, CheckCircle2, Truck, ArrowLeft, Phone, Mail } from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatDateTime } from '@/lib/utils';

export function DeliveryTrackingClient() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params.id as string;
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDelivery();
  }, [deliveryId]);

  const fetchDelivery = async () => {
    try {
      setLoading(true);
      const record = await tables.deliveries.find(deliveryId);
      setDelivery({ id: record.id, fields: record.fields });
    } catch (error) {
      console.error('Error fetching delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { label: 'Order Placed', status: 'Pending', icon: Package },
      { label: 'Preparing', status: 'Preparing', icon: Package },
      { label: 'Out for Delivery', status: 'In Transit', icon: Truck },
      { label: 'Delivered', status: 'Delivered', icon: CheckCircle2 }
    ];

    const currentStatus = delivery?.fields?.Status || 'Pending';
    const statusOrder = ['Pending', 'Preparing', 'In Transit', 'Delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading delivery information...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Delivery Not Found</h2>
          <p className="text-slate-600 mb-4">The delivery you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/deliveries')}>
            Back to Deliveries
          </Button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/deliveries')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Track Delivery</h1>
              <p className="text-slate-500">Real-time delivery tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Delivery Status</span>
            <Badge
              variant={
                delivery.fields.Status === 'Delivered' ? 'success' :
                delivery.fields.Status === 'In Transit' ? 'warning' :
                'secondary'
              }
            >
              {delivery.fields.Status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative flex items-start gap-4">
                  {/* Vertical line */}
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`absolute left-6 top-12 h-16 w-0.5 ${
                        step.completed ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full ${
                      step.completed ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h3 className={`font-semibold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </h3>
                    {step.active && (
                      <p className="text-sm text-slate-600 mt-1">
                        Your order is currently being processed
                      </p>
                    )}
                    {step.completed && !step.active && (
                      <p className="text-sm text-slate-600 mt-1">
                        Completed
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Customer Name</p>
              <p className="font-semibold text-slate-900">{delivery.fields.Customer || 'N/A'}</p>
            </div>
            {delivery.fields['Customer Contact'] && (
              <div>
                <p className="text-sm text-slate-600">Contact</p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Phone className="h-4 w-4" />
                  <p className="font-semibold">{delivery.fields['Customer Contact']}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Delivery Address</p>
              <p className="font-semibold text-slate-900">{delivery.fields['Delivery Address'] || 'N/A'}</p>
            </div>
            {delivery.fields['Delivery Method'] && (
              <div>
                <p className="text-sm text-slate-600">Delivery Method</p>
                <p className="font-semibold text-slate-900">{delivery.fields['Delivery Method']}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shipment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-600">Scheduled Date</p>
              <p className="font-semibold text-slate-900">
                {delivery.fields.Date ? formatDateTime(delivery.fields.Date) : 'Not scheduled'}
              </p>
            </div>
            {delivery.fields['Time Slot'] && (
              <div>
                <p className="text-sm text-slate-600">Time Slot</p>
                <p className="font-semibold text-slate-900">{delivery.fields['Time Slot']}</p>
              </div>
            )}
            {delivery.fields['Total Items'] && (
              <div>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="font-semibold text-slate-900">{delivery.fields['Total Items']}</p>
              </div>
            )}
            {delivery.fields['Delivery Fee'] && (
              <div>
                <p className="text-sm text-slate-600">Delivery Fee</p>
                <p className="font-semibold text-slate-900">
                  ${delivery.fields['Delivery Fee'].toFixed(2)}
                </p>
              </div>
            )}
            {delivery.fields['Payment Method'] && (
              <div>
                <p className="text-sm text-slate-600">Payment Method</p>
                <p className="font-semibold text-slate-900">{delivery.fields['Payment Method']}</p>
              </div>
            )}
            {delivery.fields.Priority && (
              <div>
                <p className="text-sm text-slate-600">Priority</p>
                <Badge variant={delivery.fields.Priority === 'Urgent' ? 'destructive' : 'secondary'}>
                  {delivery.fields.Priority}
                </Badge>
              </div>
            )}
          </div>
          {delivery.fields.Notes && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Notes</p>
              <p className="text-slate-900">{delivery.fields.Notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Need Help?</h3>
              <p className="text-sm text-slate-600">Contact our support team for assistance</p>
            </div>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
