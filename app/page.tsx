'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Warehouse,
  ArrowLeftRight,
  AlertTriangle,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Raw Materials',
    value: '156',
    change: '+12%',
    trend: 'up',
    icon: Package,
  },
  {
    title: 'Active Warehouses',
    value: '5',
    change: 'All Active',
    trend: 'neutral',
    icon: Warehouse,
  },
  {
    title: 'Pending Transfers',
    value: '23',
    change: '+5 today',
    trend: 'up',
    icon: ArrowLeftRight,
  },
  {
    title: 'Low Stock Items',
    value: '8',
    change: 'Needs attention',
    trend: 'down',
    icon: AlertTriangle,
  },
];

const recentActivity = [
  {
    id: 1,
    type: 'Stock In',
    material: 'PET Preform 28mm',
    warehouse: 'Raw Material Warehouse',
    quantity: '5000 units',
    time: '2 hours ago',
    status: 'completed',
  },
  {
    id: 2,
    type: 'Transfer',
    material: 'HDPE Bottles 500ml',
    warehouse: 'General → Oyarifa Retail',
    quantity: '1200 units',
    time: '4 hours ago',
    status: 'in-progress',
  },
  {
    id: 3,
    type: 'Stock Out',
    material: 'Labels Premium',
    warehouse: 'Finished Goods Warehouse',
    quantity: '800 units',
    time: '6 hours ago',
    status: 'completed',
  },
  {
    id: 4,
    type: 'Manufacturing',
    material: 'Full Brew Pack 1L',
    warehouse: 'Manufacturing Line 1',
    quantity: '2500 units',
    time: '8 hours ago',
    status: 'completed',
  },
];

const lowStockAlerts = [
  {
    material: 'PET Preform 18mm Clear',
    currentStock: 450,
    minStock: 1000,
    warehouse: 'Raw Material Warehouse',
    severity: 'high',
  },
  {
    material: 'Caps White 28mm',
    currentStock: 1200,
    minStock: 2000,
    warehouse: 'General Warehouse',
    severity: 'medium',
  },
  {
    material: 'Labels Economy',
    currentStock: 750,
    minStock: 1500,
    warehouse: 'Finished Goods Warehouse',
    severity: 'medium',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-slate-500" />}
                {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{activity.material}</p>
                      <Badge
                        variant={
                          activity.status === 'completed'
                            ? 'success'
                            : activity.status === 'in-progress'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {activity.type} • {activity.warehouse}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{activity.quantity}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-slate-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockAlerts.map((alert, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{alert.material}</p>
                      <p className="text-xs text-slate-500">{alert.warehouse}</p>
                    </div>
                    <Badge
                      variant={alert.severity === 'high' ? 'destructive' : 'warning'}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Current</span>
                      <span className="font-medium text-slate-900">
                        {alert.currentStock}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${
                          alert.severity === 'high' ? 'bg-slate-1000' : 'bg-slate-1000'
                        }`}
                        style={{
                          width: `${(alert.currentStock / alert.minStock) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Min: {alert.minStock}</span>
                      <span>
                        {Math.round((alert.currentStock / alert.minStock) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
