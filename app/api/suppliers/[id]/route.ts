
import { NextRequest, NextResponse } from 'next/server';
import { airtable } from '@/lib/airtable-edge';
import { verifyIdToken, getUserRole } from '@/lib/firebase-auth-edge';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { supplierSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Initialize Airtable

// GET /api/suppliers/[id] - Get single supplier
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
    if (!hasPermission(role, Permission.VIEW_SUPPLIERS)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch supplier from Airtable
    const record = await airtable.get('Suppliers', id);

    // 5. Transform to clean format
    const supplier = {
      id: record.id,
      supplierName: record.fields['Supplier Name'] || '',
      contactPerson: record.fields['Contact Person'] || '',
      phone: record.fields['Phone'] || '',
      email: record.fields['Email'] || '',
      address: record.fields['Address'] || '',
      website: record.fields['Website'] || '',
      createdTime: record.fields['Created Time'] || record.createdTime,
    };

    return NextResponse.json({ data: supplier });
  } catch (error: any) {
    console.error(`GET /api/suppliers/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Supplier not found' },
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

// PATCH /api/suppliers/[id] - Update supplier
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
    if (!hasPermission(role, Permission.UPDATE_SUPPLIER)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = supplierSchema.partial().safeParse(body);

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
    if (validatedData.supplierName !== undefined) {
      fields['Supplier Name'] = validatedData.supplierName;
    }
    if (validatedData.contactPerson !== undefined) {
      fields['Contact Person'] = validatedData.contactPerson;
    }
    if (validatedData.phone !== undefined) {
      fields['Phone'] = validatedData.phone;
    }
    if (validatedData.email !== undefined) {
      fields['Email'] = validatedData.email;
    }
    if (validatedData.address !== undefined) {
      fields['Address'] = validatedData.address;
    }
    if (validatedData.website !== undefined) {
      fields['Website'] = validatedData.website;
    }

    // 6. Update supplier in Airtable
    const record = await airtable.update('Suppliers', id, fields);
    const supplier = {
      id: record.id,
      supplierName: record.fields['Supplier Name'] || '',
      contactPerson: record.fields['Contact Person'] || '',
      phone: record.fields['Phone'] || '',
      email: record.fields['Email'] || '',
      address: record.fields['Address'] || '',
      website: record.fields['Website'] || '',
      createdTime: record.fields['Created Time'] || record.createdTime,
    };

    return NextResponse.json({ data: supplier });
  } catch (error: any) {
    console.error(`PATCH /api/suppliers/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Supplier not found' },
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

// DELETE /api/suppliers/[id] - Delete supplier
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
    if (!hasPermission(role, Permission.DELETE_SUPPLIER)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Delete supplier from Airtable
    await airtable.delete('Suppliers', [id]);

    return NextResponse.json({ success: true, message: 'Supplier deleted' });
  } catch (error: any) {
    console.error(`DELETE /api/suppliers/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Supplier not found' },
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
