'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Package, MapPin, User, Phone, Store } from 'lucide-react';
import { tables } from '@/lib/airtable';
import { useRouter } from 'next/navigation';

export default function OyarifaRetailWarehousePage() {
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<Map<string, string>>(new Map());

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

      const records = await tables.oyarifaRetailWarehouse.select().all();
      if (records.length > 0) {
        setWarehouse({ id: records[0].id, fields: records[0].fields });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-600 text-white">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Oyarifa Retail Warehouse</h1>
              <p className="text-slate-500">Proxy warehouse for retail distribution</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/inventory/stock-transfer')}>
            View Transactions
          </Button>
          <Button onClick={() => router.push('/deliveries')}>
            New Order
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
                  {warehouse?.fields['Address'] || 'Oyarifa, Accra'}
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
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Available Quantity
            </CardTitle>
            <Package className="h-4 w-4 text-slate-700" />
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
              Warehouse Type
            </CardTitle>
            <Store className="h-4 w-4 text-slate-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">Retail</div>
            <p className="text-xs text-slate-500">Proxy distribution center</p>
          </CardContent>
        </Card>
      </div>

      {/* Retail Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Retail Distribution Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-slate-300 bg-slate-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-6 w-6 text-slate-700" />
                <h3 className="font-semibold text-slate-900">From Stock Warehouse</h3>
              </div>
              <p className="text-sm text-slate-800 mb-3">
                Receives products from general warehouse for retail distribution
              </p>
              <Badge variant="success">Active Connection</Badge>
            </div>

            <div className="rounded-lg border-2 border-slate-300 bg-slate-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-6 w-6 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Fulfillment Center</h3>
              </div>
              <p className="text-sm text-slate-800 mb-3">
                Processes retail orders and prepares for delivery
              </p>
              <Badge variant="warning">Processing</Badge>
            </div>

            <div className="rounded-lg border-2 border-slate-300 bg-slate-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Store className="h-6 w-6 text-slate-700" />
                <h3 className="font-semibold text-slate-900">To Delivery</h3>
              </div>
              <p className="text-sm text-slate-800 mb-3">
                Ships completed orders via bikes, riders, and trucks
              </p>
              <Badge variant="success">Ready for Dispatch</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Operating Hours</h4>
              <p className="text-sm text-slate-600">Monday - Saturday: 8:00 AM - 6:00 PM</p>
              <p className="text-sm text-slate-600">Sunday: Closed</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Service Area</h4>
              <p className="text-sm text-slate-600">Oyarifa and surrounding areas</p>
              <p className="text-sm text-slate-600">Retail customer fulfillment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
