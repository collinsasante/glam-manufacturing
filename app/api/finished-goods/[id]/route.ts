
import { NextRequest, NextResponse } from 'next/server';
import { airtable } from '@/lib/airtable-edge';
import { verifyIdToken, getUserRole } from '@/lib/firebase-auth-edge';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { finishedGoodSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Initialize Airtable

// GET /api/finished-goods/[id] - Get single finished good
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
    if (!hasPermission(role, Permission.VIEW_FINISHED_GOODS)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch finished good from Airtable
    const record = await airtable.get('Finished Goods', id);

    // 5. Transform to clean format
    const good = {
      id: record.id,
      productName: record.fields['Product Name'] || '',
      packSize: record.fields['Pack Size/Notes'] || '',
      availableQuantity: record.fields['Available Quantity'] || 0,
      price: record.fields['Price'] || 0,
      status: record.fields['Status'] || 'Available',
      createdTime: record.fields['Created Time'] || record.createdTime,
    };

    return NextResponse.json({ data: good });
  } catch (error: any) {
    console.error(`GET /api/finished-goods/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Finished good not found' },
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

// PATCH /api/finished-goods/[id] - Update finished good
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
    if (!hasPermission(role, Permission.UPDATE_FINISHED_GOOD)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = finishedGoodSchema.partial().safeParse(body);

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
    if (validatedData.productName !== undefined) {
      fields['Product Name'] = validatedData.productName;
    }
    if (validatedData.packSize !== undefined) {
      fields['Pack Size/Notes'] = validatedData.packSize;
    }
    if (validatedData.availableQuantity !== undefined) {
      fields['Available Quantity'] = validatedData.availableQuantity;
    }
    if (validatedData.price !== undefined) {
      fields['Price'] = validatedData.price;
    }
    if (validatedData.status !== undefined) {
      fields['Status'] = validatedData.status;
    }

    // 6. Update finished good in Airtable
    const record = await airtable.update('Finished Goods', id, fields);
    const good = {
      id: record.id,
      productName: record.fields['Product Name'] || '',
      packSize: record.fields['Pack Size/Notes'] || '',
      availableQuantity: record.fields['Available Quantity'] || 0,
      price: record.fields['Price'] || 0,
      status: record.fields['Status'] || 'Available',
      createdTime: record.fields['Created Time'] || record.createdTime,
    };

    return NextResponse.json({ data: good });
  } catch (error: any) {
    console.error(`PATCH /api/finished-goods/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Finished good not found' },
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

// DELETE /api/finished-goods/[id] - Delete finished good
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
    if (!hasPermission(role, Permission.DELETE_FINISHED_GOOD)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Delete finished good from Airtable
    await airtable.delete('Finished Goods', [id]);

    return NextResponse.json({ success: true, message: 'Finished good deleted' });
  } catch (error: any) {
    console.error(`DELETE /api/finished-goods/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Finished good not found' },
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
