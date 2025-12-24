'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Factory, ArrowLeft } from 'lucide-react';
import { tables } from '@/lib/airtable';
import { formatDateTime } from '@/lib/utils';

export default function ProductionSchedulePage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchSchedule();
  }, [currentWeek]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const records = await tables.manufacturing
        .select({
          filterByFormula: "OR({Status} = 'Pending', {Status} = 'In Progress')",
          sort: [{ field: 'Start Date', direction: 'asc' }],
        })
        .all();

      setSchedule(records.map(r => ({ id: r.id, fields: r.fields })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getOrdersForDate = (date: Date) => {
    return schedule.filter(order => {
      const startDate = order.fields['Start Date'];
      if (!startDate) return false;
      const orderDate = new Date(startDate);
      return orderDate.toDateString() === date.toDateString();
    });
  };

  const productionLines = ['Line 1', 'Line 2', 'Line 3', 'Assembly Line', 'Quality Line'];
  const weekDays = getWeekDays();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 mx-auto"></div>
          <p className="text-slate-600">Loading production schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Production Schedule</h1>
                <p className="text-slate-500">Weekly production timetable and planning</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const prev = new Date(currentWeek);
            prev.setDate(prev.getDate() - 7);
            setCurrentWeek(prev);
          }}>
            Previous Week
          </Button>
          <Button variant="outline" onClick={() => setCurrentWeek(new Date())}>
            This Week
          </Button>
          <Button variant="outline" onClick={() => {
            const next = new Date(currentWeek);
            next.setDate(next.getDate() + 7);
            setCurrentWeek(next);
          }}>
            Next Week
          </Button>
        </div>
      </div>

      {/* Production Summary */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              This Week
            </CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{schedule.length}</div>
            <p className="text-xs text-slate-500">Total orders scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {schedule.filter(o => o.fields['Status'] === 'In Progress').length}
            </div>
            <p className="text-xs text-slate-500">Currently in production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {schedule.filter(o => o.fields['Status'] === 'Pending').length}
            </div>
            <p className="text-xs text-slate-500">Awaiting production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Urgent Orders
            </CardTitle>
            <Factory className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {schedule.filter(o => o.fields['Priority'] === 'Urgent').length}
            </div>
            <p className="text-xs text-slate-500">High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Week Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Week of {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <Badge variant="outline">{schedule.length} Orders Scheduled</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="p-3 text-left font-semibold text-slate-900 bg-slate-50 sticky left-0">
                    Production Line
                  </th>
                  {weekDays.map((day, idx) => (
                    <th key={idx} className="p-3 text-center font-semibold text-slate-900 bg-slate-50 min-w-[150px]">
                      <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-xs font-normal text-slate-500">
                        {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productionLines.map((line) => (
                  <tr key={line} className="border-b border-slate-200">
                    <td className="p-3 font-medium text-slate-900 bg-slate-50 sticky left-0">
                      <div className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-slate-600" />
                        {line}
                      </div>
                    </td>
                    {weekDays.map((day, idx) => {
                      const ordersForDay = getOrdersForDate(day).filter(
                        order => order.fields['Production Line'] === line
                      );
                      const isToday = day.toDateString() === new Date().toDateString();

                      return (
                        <td
                          key={idx}
                          className={`p-2 align-top ${isToday ? 'bg-slate-100' : ''}`}
                        >
                          <div className="space-y-2">
                            {ordersForDay.map((order) => (
                              <div
                                key={order.id}
                                className="rounded-md border border-slate-200 bg-white p-2 text-xs cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => router.push('/manufacturing')}
                              >
                                <div className="font-semibold text-slate-900 truncate">
                                  {order.fields['Product'] || 'Order'}
                                </div>
                                <div className="text-slate-600 mt-1">
                                  Qty: {order.fields['Quantity']?.toLocaleString() || 'N/A'}
                                </div>
                                <div className="mt-1">
                                  <Badge
                                    variant={order.fields['Status'] === 'In Progress' ? 'warning' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {order.fields['Status']}
                                  </Badge>
                                </div>
                                {order.fields['Priority'] === 'Urgent' && (
                                  <div className="mt-1">
                                    <Badge variant="destructive" className="text-xs">
                                      Urgent
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                            {ordersForDay.length === 0 && (
                              <div className="text-slate-400 text-xs text-center py-4">
                                No orders
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
