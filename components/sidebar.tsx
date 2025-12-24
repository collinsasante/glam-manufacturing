'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  TrendingUp,
  Users,
  FileText,
  Truck,
  Factory,
  Settings,
  Package2,
  ArrowLeftRight,
  PackageCheck,
  Building2,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Inventory',
    icon: Package,
    children: [
      { name: 'Raw Materials', href: '/inventory/raw-materials', icon: Package2 },
      { name: 'Finished Goods', href: '/inventory/finished-goods', icon: PackageCheck },
      { name: 'Stock Movement', href: '/inventory/stock-movement', icon: TrendingUp },
      { name: 'Stock Transfer', href: '/inventory/stock-transfer', icon: ArrowLeftRight },
    ],
  },
  {
    name: 'Warehouses',
    icon: Warehouse,
    children: [
      { name: 'General Warehouse', href: '/warehouses/general', icon: Building2 },
      { name: 'Raw Material Warehouse', href: '/warehouses/raw-material', icon: Package },
      { name: 'Finished Goods', href: '/warehouses/finished-goods', icon: PackageCheck },
      { name: 'Oyarifa Retail', href: '/warehouses/oyarifa-retail', icon: Building2 },
      { name: 'A-Z Bulk', href: '/warehouses/az-bulk', icon: Warehouse },
    ],
  },
  {
    name: 'Manufacturing',
    href: '/manufacturing',
    icon: Factory,
  },
  {
    name: 'Suppliers',
    href: '/suppliers',
    icon: Users,
  },
  {
    name: 'Deliveries',
    href: '/deliveries',
    icon: Truck,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <h1 className="text-xl font-bold text-slate-900">GlamPack</h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700">
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
                <div className="ml-8 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        pathname === child.href
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <child.icon className="h-4 w-4" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
