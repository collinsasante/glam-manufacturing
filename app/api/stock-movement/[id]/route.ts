
import { NextRequest, NextResponse } from 'next/server';
import { airtable } from '@/lib/airtable-edge';
import { verifyIdToken, getUserRole } from '@/lib/firebase-auth-edge';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Initialize Airtable

// GET /api/stock-movement/[id] - Get single stock movement
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
    if (!hasPermission(role, Permission.VIEW_STOCK_MOVEMENT)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch stock movement from Airtable
    const record = await airtable.get('Stock Movement', id);

    // 5. Transform to clean format
    const movement = {
      id: record.id,
      material: record.fields['Material'] || [],
      transactionType: record.fields['Transaction Type'] || '',
      quantity: record.fields['Quantity'] || 0,
      unitCost: record.fields['Unit Cost'] || 0,
      reason: record.fields['Reason'] || '',
      from: record.fields['From'] || '',
      to: record.fields['To'] || '',
      date: record.fields['Date'] || '',
      createdTime: record.fields['Created Time'] || record.createdTime,
    };

    return NextResponse.json({ data: movement });
  } catch (error: any) {
    console.error(`GET /api/stock-movement/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Stock movement not found' },
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

// DELETE /api/stock-movement/[id] - Delete stock movement
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
    if (!hasPermission(role, Permission.DELETE_STOCK_MOVEMENT)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Delete stock movement from Airtable
    await airtable.delete('Stock Movement', [id]);

    return NextResponse.json({ success: true, message: 'Stock movement deleted' });
  } catch (error: any) {
    console.error(`DELETE /api/stock-movement/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Stock movement not found' },
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
