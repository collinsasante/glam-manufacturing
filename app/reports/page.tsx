'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Warehouse,
  Factory,
  Truck,
  DollarSign,
  BarChart3,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({
    materials: [],
    finishedGoods: [],
    movements: [],
    transfers: [],
    deliveries: [],
    manufacturing: [],
    suppliers: [],
  });
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [materials, finishedGoods, movements, transfers, deliveries, manufacturing, suppliers] = await Promise.all([
        tables.rawMaterials.select({ maxRecords: 500 }).all(),
        tables.finishedGoodsWarehouse.select({ maxRecords: 500 }).all(),
        tables.stockMovement.select({ maxRecords: 500 }).all(),
        tables.stockTransfer.select({ maxRecords: 500 }).all(),
        tables.deliveries.select({ maxRecords: 500 }).all(),
        tables.manufacturing.select({ maxRecords: 500 }).all(),
        tables.suppliers.select({ maxRecords: 500 }).all(),
      ]);

      setReportData({
        materials: materials.map(r => ({ id: r.id, fields: r.fields })),
        finishedGoods: finishedGoods.map(r => ({ id: r.id, fields: r.fields })),
        movements: movements.map(r => ({ id: r.id, fields: r.fields })),
        transfers: transfers.map(r => ({ id: r.id, fields: r.fields })),
        deliveries: deliveries.map(r => ({ id: r.id, fields: r.fields })),
        manufacturing: manufacturing.map(r => ({ id: r.id, fields: r.fields })),
        suppliers: suppliers.map(r => ({ id: r.id, fields: r.fields })),
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data: any[], reportName: string) => {
    if (data.length === 0) {
      alert('No data available to export');
      return;
    }

    // Get all unique field names
    const allFields = new Set<string>();
    data.forEach(item => {
      Object.keys(item.fields).forEach(key => allFields.add(key));
    });
    const headers = Array.from(allFields);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(item =>
        headers.map(header => {
          const value = item.fields[header];
          if (value === null || value === undefined) return '';
          // Escape commas and quotes
          const stringValue = String(value).replace(/"/g, '""');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (reportType: string) => {
    let dataToExport: any[] = [];
    let reportName = '';

    switch (reportType) {
      case 'Raw Materials':
        dataToExport = reportData.materials;
        reportName = 'raw_materials_report';
        break;
      case 'Finished Goods':
        dataToExport = reportData.finishedGoods;
        reportName = 'finished_goods_report';
        break;
      case 'Stock Valuation':
        dataToExport = reportData.materials;
        reportName = 'stock_valuation_report';
        break;
      case 'Stock Movement':
        dataToExport = reportData.movements;
        reportName = 'stock_movement_report';
        break;
      case 'Stock Transfer':
        dataToExport = reportData.transfers;
        reportName = 'stock_transfer_report';
        break;
      case 'Deliveries':
        dataToExport = reportData.deliveries;
        reportName = 'deliveries_report';
        break;
      case 'Production':
        dataToExport = reportData.manufacturing;
        reportName = 'production_report';
        break;
      case 'Suppliers':
        dataToExport = reportData.suppliers;
        reportName = 'suppliers_report';
        break;
      case 'All Data':
        // Combine all data
        const allData = [
          ...reportData.materials.map((m: any) => ({ ...m.fields, _source: 'Raw Materials' })),
          ...reportData.finishedGoods.map((f: any) => ({ ...f.fields, _source: 'Finished Goods' })),
          ...reportData.movements.map((m: any) => ({ ...m.fields, _source: 'Stock Movement' })),
          ...reportData.transfers.map((t: any) => ({ ...t.fields, _source: 'Stock Transfer' })),
          ...reportData.deliveries.map((d: any) => ({ ...d.fields, _source: 'Deliveries' })),
          ...reportData.manufacturing.map((m: any) => ({ ...m.fields, _source: 'Manufacturing' })),
          ...reportData.suppliers.map((s: any) => ({ ...s.fields, _source: 'Suppliers' })),
        ];
        dataToExport = allData.map(item => ({ fields: item }));
        reportName = 'all_warehouse_data';
        break;
      default:
        dataToExport = [];
    }

    convertToCSV(dataToExport, reportName);

    // Add to generated reports history
    const newReport = {
      id: Date.now(),
      name: reportType,
      type: 'Export (CSV)',
      date: new Date().toISOString(),
      records: dataToExport.length,
    };
    setGeneratedReports(prev => [newReport, ...prev]);
  };

  const handleGenerateReport = (reportType: string) => {
    let reportContent: any = {};
    let dataCount = 0;

    switch (reportType) {
      case 'Raw Materials':
        reportContent = {
          title: 'Raw Materials Inventory Report',
          data: reportData.materials,
          summary: {
            totalItems: reportData.materials.length,
            totalValue: reportData.materials.reduce((sum: number, m: any) => sum + (m.fields['Total Value'] || 0), 0),
            lowStock: reportData.materials.filter((m: any) => m.fields['Stock Status'] === 'Low Stock').length,
          }
        };
        dataCount = reportData.materials.length;
        break;
      case 'Finished Goods':
        reportContent = {
          title: 'Finished Goods Inventory Report',
          data: reportData.finishedGoods,
          summary: {
            totalProducts: reportData.finishedGoods.length,
            totalQuantity: reportData.finishedGoods.reduce((sum: number, f: any) => sum + (f.fields['Quantity'] || 0), 0),
            totalValue: reportData.finishedGoods.reduce((sum: number, f: any) => sum + (f.fields['Total Value'] || 0), 0),
          }
        };
        dataCount = reportData.finishedGoods.length;
        break;
      case 'Stock Valuation':
        const totalMaterialsValue = reportData.materials.reduce((sum: number, m: any) => sum + (m.fields['Total Value'] || 0), 0);
        const totalGoodsValue = reportData.finishedGoods.reduce((sum: number, f: any) => sum + (f.fields['Total Value'] || 0), 0);
        reportContent = {
          title: 'Stock Valuation Report',
          data: {
            rawMaterials: reportData.materials,
            finishedGoods: reportData.finishedGoods,
          },
          summary: {
            rawMaterialsValue: totalMaterialsValue,
            finishedGoodsValue: totalGoodsValue,
            totalValue: totalMaterialsValue + totalGoodsValue,
          }
        };
        dataCount = reportData.materials.length + reportData.finishedGoods.length;
        break;
      case 'Stock Movement':
        reportContent = {
          title: 'Stock Movement Report',
          data: reportData.movements,
          summary: {
            totalMovements: reportData.movements.length,
            stockIn: reportData.movements.filter((m: any) => m.fields['Transaction Type'] === 'In').length,
            stockOut: reportData.movements.filter((m: any) => m.fields['Transaction Type'] === 'Out').length,
          }
        };
        dataCount = reportData.movements.length;
        break;
      case 'Stock Transfer':
        reportContent = {
          title: 'Stock Transfer Report',
          data: reportData.transfers,
          summary: {
            totalTransfers: reportData.transfers.length,
            completed: reportData.transfers.filter((t: any) => t.fields['Status'] === 'Completed').length,
            pending: reportData.transfers.filter((t: any) => t.fields['Status'] === 'Pending').length,
          }
        };
        dataCount = reportData.transfers.length;
        break;
      case 'Deliveries':
        reportContent = {
          title: 'Delivery Performance Report',
          data: reportData.deliveries,
          summary: {
            totalDeliveries: reportData.deliveries.length,
            completed: reportData.deliveries.filter((d: any) => d.fields['Status'] === 'Completed').length,
            inProgress: reportData.deliveries.filter((d: any) => d.fields['Status'] === 'In Progress').length,
            pending: reportData.deliveries.filter((d: any) => d.fields['Status'] === 'Pending').length,
          }
        };
        dataCount = reportData.deliveries.length;
        break;
      case 'Production':
        reportContent = {
          title: 'Production Report',
          data: reportData.manufacturing,
          summary: {
            totalOrders: reportData.manufacturing.length,
            completed: reportData.manufacturing.filter((m: any) => m.fields['Status'] === 'Completed').length,
            inProgress: reportData.manufacturing.filter((m: any) => m.fields['Status'] === 'In Progress').length,
            pending: reportData.manufacturing.filter((m: any) => m.fields['Status'] === 'Pending').length,
          }
        };
        dataCount = reportData.manufacturing.length;
        break;
      case 'Suppliers':
        reportContent = {
          title: 'Supplier Performance Report',
          data: reportData.suppliers,
          summary: {
            totalSuppliers: reportData.suppliers.length,
            active: reportData.suppliers.filter((s: any) => s.fields['Status'] === 'Active').length,
            inactive: reportData.suppliers.filter((s: any) => s.fields['Status'] === 'Inactive').length,
          }
        };
        dataCount = reportData.suppliers.length;
        break;
    }

    // Add to generated reports history
    const newReport = {
      id: Date.now(),
      name: reportType,
      type: 'Detailed Report',
      date: new Date().toISOString(),
      records: dataCount,
      content: reportContent,
    };
    setGeneratedReports(prev => [newReport, ...prev]);
    setSelectedReport(newReport);
    setShowReportModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalInventoryValue = reportData.materials.reduce(
    (sum: number, m: any) => sum + (m.fields['Available Amount'] || 0),
    0
  );

  const stockInValue = reportData.movements
    .filter((m: any) => m.fields['Transaction Type'] === 'In')
    .reduce((sum: number, m: any) => sum + (m.fields['Total Value'] || 0), 0);

  const stockOutValue = reportData.movements
    .filter((m: any) => m.fields['Transaction Type'] === 'Out')
    .reduce((sum: number, m: any) => sum + (m.fields['Total Value'] || 0), 0);

  const completedDeliveries = reportData.deliveries.filter(
    (d: any) => d.fields['Status'] === 'Completed'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500">
            Generate comprehensive reports and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowDateRangeModal(true)}>
            <Calendar className="h-4 w-4" />
            {dateRange.start && dateRange.end
              ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`
              : 'Date Range'}
          </Button>
          <Button className="gap-2" onClick={() => handleExport('All Data')}>
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalInventoryValue)}
            </div>
            <p className="text-xs text-slate-500">Current stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Stock In Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {formatCurrency(stockInValue)}
            </div>
            <p className="text-xs text-slate-500">Incoming value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Stock Out Value
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {formatCurrency(stockOutValue)}
            </div>
            <p className="text-xs text-slate-500">Outgoing value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Completed Deliveries
            </CardTitle>
            <Truck className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {completedDeliveries}
            </div>
            <p className="text-xs text-slate-500">Total delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inventory Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-slate-700" />
              Inventory Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Raw Materials Report</h3>
                  <p className="text-sm text-slate-500">
                    Complete inventory with costs and stock levels
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-slate-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateReport('Raw Materials')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport('Raw Materials')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Finished Goods Report</h3>
                  <p className="text-sm text-slate-500">
                    Product inventory with pricing and availability
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-slate-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateReport('Finished Goods')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport('Finished Goods')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Stock Valuation Report</h3>
                  <p className="text-sm text-slate-500">
                    Total inventory value by category
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-slate-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateReport('Stock Valuation')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport('Stock Valuation')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-slate-700" />
              Operations Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Stock Movement Report</h3>
                  <p className="text-sm text-slate-500">
                    All stock in/out transactions with details
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateReport('Stock Movement')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport('Stock Movement')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Transfer Report</h3>
                  <p className="text-sm text-slate-500">
                    Inter-warehouse transfers and status
                  </p>
                </div>
                <FileSpreadsheet className="h-8 w-8 text-slate-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateReport('Stock Transfer')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport('Stock Transfer')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Delivery Report</h3>
                  <p className="text-sm text-slate-500">
                    Delivery performance and status tracking
                  </p>
                </div>
                <Truck className="h-8 w-8 text-slate-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateReport('Deliveries')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport('Deliveries')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manufacturing & Supplier Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-orange-600" />
              Manufacturing Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Production Report</h3>
                  <p className="text-sm text-slate-500">
                    Manufacturing orders and completion rates
                  </p>
                </div>
                <Factory className="h-8 w-8 text-orange-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateReport('Production')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport('Production')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-700" />
              Supplier Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">Supplier Performance</h3>
                  <p className="text-sm text-slate-500">
                    Supplier activity and delivery metrics
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-slate-500" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleGenerateReport('Suppliers')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Generate
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleExport('Suppliers')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Report Generation History</CardTitle>
        </CardHeader>
        <CardContent>
          {generatedReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No reports generated yet</p>
              <p className="text-sm text-slate-400">
                Click on any Generate or Export button above to create reports
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {generatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      {report.type.includes('CSV') ? (
                        <FileSpreadsheet className="h-5 w-5 text-slate-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{report.name}</h4>
                      <p className="text-sm text-slate-500">
                        {report.type} • {report.records} records • {new Date(report.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {report.content && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportModal(true);
                      }}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Range Filter Modal */}
      {showDateRangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDateRangeModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <Calendar className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Select Date Range</h2>
                    <p className="text-slate-500">Filter reports by date</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowDateRangeModal(false);
                    }}
                    className="flex-1"
                    disabled={!dateRange.start || !dateRange.end}
                  >
                    Apply Filter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateRange({ start: '', end: '' });
                      setShowDateRangeModal(false);
                    }}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Viewer Modal */}
      {showReportModal && selectedReport && selectedReport.content && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <FileText className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedReport.content.title}</h2>
                    <p className="text-slate-500">
                      Generated on {new Date(selectedReport.date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowReportModal(false)}>
                  Close
                </Button>
              </div>

              {/* Summary Section */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedReport.content.summary).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <p className="text-sm text-slate-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {typeof value === 'number' && key.toLowerCase().includes('value')
                          ? formatCurrency(value)
                          : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Data Preview (First 10 records)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-50">
                        {selectedReport.content.data &&
                          Array.isArray(selectedReport.content.data) &&
                          selectedReport.content.data.length > 0 &&
                          Object.keys(selectedReport.content.data[0].fields).slice(0, 5).map((key) => (
                            <th key={key} className="p-3 text-left text-sm font-semibold text-slate-900">
                              {key}
                            </th>
                          ))
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.content.data &&
                        Array.isArray(selectedReport.content.data) &&
                        selectedReport.content.data.slice(0, 10).map((item: any, index: number) => (
                          <tr key={index} className="border-b border-slate-200">
                            {Object.values(item.fields).slice(0, 5).map((value: any, idx: number) => (
                              <td key={idx} className="p-3 text-sm text-slate-700">
                                {value !== null && value !== undefined ? String(value) : 'N/A'}
                              </td>
                            ))}
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                {selectedReport.content.data &&
                  Array.isArray(selectedReport.content.data) &&
                  selectedReport.content.data.length > 10 && (
                  <p className="text-sm text-slate-500 mt-3 text-center">
                    Showing 10 of {selectedReport.content.data.length} records
                  </p>
                )}
              </div>

              {/* Export Actions */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (selectedReport.name) {
                        handleExport(selectedReport.name);
                      }
                    }}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button variant="outline" onClick={() => setShowReportModal(false)} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
