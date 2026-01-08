
import { NextRequest, NextResponse } from 'next/server';
import { airtable } from '@/lib/airtable-edge';
import { verifyIdToken, getUserRole } from '@/lib/firebase-auth-edge';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { finishedGoodSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Initialize Airtable

// GET /api/finished-goods - List all finished goods
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
    if (!hasPermission(role, Permission.VIEW_FINISHED_GOODS)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch finished goods from Airtable
    const records = await airtable.list('Finished Goods', {
        sort: [{ field: 'Product Name', direction: 'asc' }],
      });

    // 5. Transform Airtable records to clean format
    const goods = records.map((record) => ({
      id: record.id,
      productName: record.fields['Product Name'] || '',
      packSize: record.fields['Pack Size/Notes'] || '',
      availableQuantity: record.fields['Available Quantity'] || 0,
      price: record.fields['Price'] || 0,
      status: record.fields['Status'] || 'Available',
      createdTime: record.fields['Created Time'] || record.createdTime,
    }));

    return NextResponse.json({ data: goods, count: goods.length });
  } catch (error: any) {
    console.error('GET /api/finished-goods error:', error);

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

// POST /api/finished-goods - Create new finished good
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
    if (!hasPermission(role, Permission.CREATE_FINISHED_GOOD)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = finishedGoodSchema.safeParse(body);

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

    // 5. Create finished good in Airtable
    const record = await airtable.create('Finished Goods', {
      'Product Name': validatedData.productName,
      'Pack Size/Notes': validatedData.packSize || '',
      'Available Quantity': validatedData.availableQuantity || 0,
      'Price': validatedData.price || 0,
      'Status': validatedData.status || 'Available',
    });
    const good = {
      id: record.id,
      productName: record.fields['Product Name'] || '',
      packSize: record.fields['Pack Size/Notes'] || '',
      availableQuantity: record.fields['Available Quantity'] || 0,
      price: record.fields['Price'] || 0,
      status: record.fields['Status'] || 'Available',
      createdTime: record.createdTime,
    };

    return NextResponse.json({ data: good }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/finished-goods error:', error);

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
