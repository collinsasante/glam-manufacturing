'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Plus, Search, Filter, Mail, Phone, Globe, Building2 } from 'lucide-react';
import { tables } from '@/lib/airtable';
import type { Supplier } from '@/types';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierType: 'Distributor',
    status: 'Active',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    paymentTerms: 'Net 30',
    notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const records = await tables.suppliers
        .select({
          maxRecords: 100,
          sort: [{ field: 'Supplier Name', direction: 'asc' }],
        })
        .all();

      const suppliersData = records.map((record) => ({
        id: record.id,
        fields: record.fields as Supplier['fields'],
      }));

      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSupplier = async () => {
    try {
      await tables.suppliers.create({
        'Supplier Name': formData.supplierName,
        'Supplier Type': formData.supplierType,
        'Status': formData.status,
        'Contact Person': formData.contactPerson,
        'Email': formData.email,
        'Phone': formData.phone,
        'Address': formData.address,
        'Website': formData.website,
        'Payment Terms': formData.paymentTerms,
        'Notes': formData.notes
      });

      // Reset form
      setFormData({
        supplierName: '',
        supplierType: 'Distributor',
        status: 'Active',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        paymentTerms: 'Net 30',
        notes: ''
      });
      setShowNewSupplierModal(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Failed to create supplier. Please try again.');
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.fields['Supplier Name']
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const activeSuppliers = suppliers.filter(
    (s) => s.fields['Status'] === 'Active'
  ).length;

  const factoryCount = suppliers.filter(
    (s) => s.fields['Supplier Type'] === 'Factory'
  ).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-slate-500">Manage your supplier relationships</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewSupplierModal(true)}>
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {suppliers.length}
            </div>
            <p className="text-xs text-slate-500">Registered suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Active Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {activeSuppliers}
            </div>
            <p className="text-xs text-slate-500">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Factory Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{factoryCount}</div>
            <p className="text-xs text-slate-500">Direct manufacturers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Suppliers</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setShowDetailModal(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                        <Building2 className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {supplier.fields['Supplier Name']}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {supplier.fields['Supplier ID']}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        supplier.fields['Status'] === 'Active'
                          ? 'success'
                          : 'secondary'
                      }
                    >
                      {supplier.fields['Status'] || 'Unknown'}
                    </Badge>
                    {supplier.fields['Supplier Type'] && (
                      <Badge variant="outline">
                        {supplier.fields['Supplier Type']}
                      </Badge>
                    )}
                  </div>

                  {supplier.fields['Contact Person'] && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Contact: </span>
                      {supplier.fields['Contact Person']}
                    </div>
                  )}

                  {supplier.fields['Phone'] && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4" />
                      {supplier.fields['Phone']}
                    </div>
                  )}

                  {supplier.fields['Email'] && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4" />
                      {supplier.fields['Email']}
                    </div>
                  )}

                  {supplier.fields['Website'] && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Globe className="h-4 w-4" />
                      <a
                        href={supplier.fields['Website']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  {supplier.fields['Address'] && (
                    <div className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">
                      {supplier.fields['Address']}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-500">No suppliers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Supplier Modal */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewSupplierModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <Building2 className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">New Supplier</h2>
                    <p className="text-slate-500">Add a new supplier to your network</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="supplierName">Supplier Name *</Label>
                    <Input
                      id="supplierName"
                      placeholder="e.g., Acme Packaging Ltd"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplierType">Supplier Type</Label>
                    <Select
                      id="supplierType"
                      value={formData.supplierType}
                      onChange={(e) => setFormData({...formData, supplierType: e.target.value})}
                    >
                      <option value="Factory">Factory</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Wholesaler">Wholesaler</option>
                      <option value="Raw Material Supplier">Raw Material Supplier</option>
                      <option value="Local Supplier">Local Supplier</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Under Review">Under Review</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Jane Smith"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+233 XX XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="supplier@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://www.company.com"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <textarea
                      id="address"
                      rows={2}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      placeholder="123 Industrial Area, Accra"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                    >
                      <option value="COD">COD</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Net 90">Net 90</option>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      placeholder="Additional information about the supplier..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmitSupplier} className="flex-1" disabled={!formData.supplierName}>
                    Add Supplier
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewSupplierModal(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <Building2 className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedSupplier.fields['Supplier Name']}
                    </h2>
                    <p className="text-slate-500">{selectedSupplier.fields['Supplier ID'] || 'Supplier Details'}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Status</p>
                    <Badge variant={selectedSupplier.fields['Status'] === 'Active' ? 'success' : 'secondary'}>
                      {selectedSupplier.fields['Status'] || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Supplier Type</p>
                    <Badge variant="outline">{selectedSupplier.fields['Supplier Type'] || 'N/A'}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Contact Person</p>
                    <p className="font-semibold text-slate-900">{selectedSupplier.fields['Contact Person'] || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-semibold text-slate-900">{selectedSupplier.fields['Phone'] || 'N/A'}</p>
                  </div>
                  {selectedSupplier.fields['Email'] && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{selectedSupplier.fields['Email']}</p>
                    </div>
                  )}
                  {selectedSupplier.fields['Website'] && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm text-slate-500">Website</p>
                      <a href={selectedSupplier.fields['Website']} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:underline">
                        {selectedSupplier.fields['Website']}
                      </a>
                    </div>
                  )}
                  {selectedSupplier.fields['Address'] && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm text-slate-500">Address</p>
                      <p className="font-semibold text-slate-900">{selectedSupplier.fields['Address']}</p>
                    </div>
                  )}
                </div>

                {Object.keys(selectedSupplier.fields).length > 0 && (
                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-900 mb-3">All Details</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedSupplier.fields).map(([key, value]: [string, any]) => (
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
