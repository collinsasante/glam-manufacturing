
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { verifyIdToken, getUserRole } from '@/lib/firebase-admin';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { deliverySchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

// GET /api/deliveries - List all deliveries
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    // 2. Get user role
    const role = (await getUserRole(decodedToken.uid)) as UserRole;

    // 3. Check permissions
    if (!hasPermission(role, Permission.VIEW_DELIVERIES)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch deliveries from Airtable
    const records = await base('Deliveries')
      .select({
        sort: [{ field: 'Date', direction: 'desc' }],
      })
      .all();

    // 5. Transform Airtable records to clean format
    const deliveries = records.map((record) => ({
      id: record.id,
      deliveryId: record.fields['Delivery ID'] || '',
      customer: record.fields['Customer'] || '',
      totalStops: record.fields['Total Stops'] || 0,
      rider: record.fields['Rider'] || [],
      date: record.fields['Date'] || '',
      status: record.fields['Status'] || '',
      notes: record.fields['Notes'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    }));

    return NextResponse.json({ data: deliveries, count: deliveries.length });
  } catch (error: any) {
    console.error('GET /api/deliveries error:', error);

    // Handle Firebase auth errors
    if (error.code?.startsWith('auth/')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const message = handleApiError(error);
    return NextResponse.json(
      { error: message },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/deliveries - Create new delivery
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    // 2. Get user role
    const role = (await getUserRole(decodedToken.uid)) as UserRole;

    // 3. Check permissions
    if (!hasPermission(role, Permission.CREATE_DELIVERY)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = deliverySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // 5. Create delivery in Airtable
    const createdRecords = await base('Deliveries').create([
      {
        fields: {
          'Delivery ID': validatedData.deliveryId || '',
          'Customer': validatedData.customer,
          'Total Stops': validatedData.totalStops || 0,
          'Rider': validatedData.rider ? [validatedData.rider] : undefined,
          'Date': validatedData.date || new Date().toISOString().split('T')[0],
          'Status': validatedData.status || 'Pending',
          'Notes': validatedData.notes || '',
        },
      },
    ]);

    const record = createdRecords[0];
    const delivery = {
      id: record.id,
      deliveryId: record.fields['Delivery ID'] || '',
      customer: record.fields['Customer'] || '',
      totalStops: record.fields['Total Stops'] || 0,
      rider: record.fields['Rider'] || [],
      date: record.fields['Date'] || '',
      status: record.fields['Status'] || '',
      notes: record.fields['Notes'] || '',
      createdTime: record._rawJson.createdTime,
    };

    return NextResponse.json({ data: delivery }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/deliveries error:', error);

    // Handle Firebase auth errors
    if (error.code?.startsWith('auth/')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const message = handleApiError(error);
    return NextResponse.json(
      { error: message },
      { status: error.statusCode || 500 }
    );
  }
}
