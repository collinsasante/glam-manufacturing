import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { verifyIdToken, getUserRole } from '@/lib/firebase-admin';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { deliverySchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

// GET /api/deliveries/[id] - Get single delivery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

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

    // 4. Fetch delivery from Airtable
    const record = await base('Deliveries').find(id);

    // 5. Transform to clean format
    const delivery = {
      id: record.id,
      deliveryId: record.fields['Delivery ID'] || '',
      customer: record.fields['Customer'] || '',
      totalStops: record.fields['Total Stops'] || 0,
      rider: record.fields['Rider'] || [],
      date: record.fields['Date'] || '',
      status: record.fields['Status'] || '',
      notes: record.fields['Notes'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    };

    return NextResponse.json({ data: delivery });
  } catch (error: any) {
    console.error(`GET /api/deliveries/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

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

// PATCH /api/deliveries/[id] - Update delivery
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

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
    if (!hasPermission(role, Permission.UPDATE_DELIVERY)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = deliverySchema.partial().safeParse(body);

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

    // 5. Build fields object (only include provided fields)
    const fields: Record<string, any> = {};
    if (validatedData.deliveryId !== undefined) {
      fields['Delivery ID'] = validatedData.deliveryId;
    }
    if (validatedData.customer !== undefined) {
      fields['Customer'] = validatedData.customer;
    }
    if (validatedData.totalStops !== undefined) {
      fields['Total Stops'] = validatedData.totalStops;
    }
    if (validatedData.rider !== undefined) {
      fields['Rider'] = validatedData.rider ? [validatedData.rider] : undefined;
    }
    if (validatedData.date !== undefined) {
      fields['Date'] = validatedData.date;
    }
    if (validatedData.status !== undefined) {
      fields['Status'] = validatedData.status;
    }
    if (validatedData.notes !== undefined) {
      fields['Notes'] = validatedData.notes;
    }

    // 6. Update delivery in Airtable
    const updatedRecords = await base('Deliveries').update([
      {
        id: id,
        fields,
      },
    ]);

    const record = updatedRecords[0];
    const delivery = {
      id: record.id,
      deliveryId: record.fields['Delivery ID'] || '',
      customer: record.fields['Customer'] || '',
      totalStops: record.fields['Total Stops'] || 0,
      rider: record.fields['Rider'] || [],
      date: record.fields['Date'] || '',
      status: record.fields['Status'] || '',
      notes: record.fields['Notes'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    };

    return NextResponse.json({ data: delivery });
  } catch (error: any) {
    console.error(`PATCH /api/deliveries/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

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

// DELETE /api/deliveries/[id] - Delete delivery
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

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
    if (!hasPermission(role, Permission.DELETE_DELIVERY)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Delete delivery from Airtable
    await base('Deliveries').destroy([id]);

    return NextResponse.json({ success: true, message: 'Delivery deleted' });
  } catch (error: any) {
    console.error(`DELETE /api/deliveries/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

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
