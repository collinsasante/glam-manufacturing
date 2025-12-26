
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { verifyIdToken, getUserRole } from '@/lib/firebase-admin';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { supplierSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

// GET /api/suppliers - List all suppliers
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
    if (!hasPermission(role, Permission.VIEW_SUPPLIERS)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch suppliers from Airtable
    const records = await base('Suppliers')
      .select({
        sort: [{ field: 'Supplier Name', direction: 'asc' }],
      })
      .all();

    // 5. Transform Airtable records to clean format
    const suppliers = records.map((record) => ({
      id: record.id,
      supplierName: record.fields['Supplier Name'] || '',
      contactPerson: record.fields['Contact Person'] || '',
      phone: record.fields['Phone'] || '',
      email: record.fields['Email'] || '',
      address: record.fields['Address'] || '',
      website: record.fields['Website'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    }));

    return NextResponse.json({ data: suppliers, count: suppliers.length });
  } catch (error: any) {
    console.error('GET /api/suppliers error:', error);

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

// POST /api/suppliers - Create new supplier
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
    if (!hasPermission(role, Permission.CREATE_SUPPLIER)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = supplierSchema.safeParse(body);

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

    // 5. Create supplier in Airtable
    const createdRecords = await base('Suppliers').create([
      {
        fields: {
          'Supplier Name': validatedData.supplierName,
          'Contact Person': validatedData.contactPerson || '',
          'Phone': validatedData.phone || '',
          'Email': validatedData.email || '',
          'Address': validatedData.address || '',
          'Website': validatedData.website || '',
        },
      },
    ]);

    const record = createdRecords[0];
    const supplier = {
      id: record.id,
      supplierName: record.fields['Supplier Name'] || '',
      contactPerson: record.fields['Contact Person'] || '',
      phone: record.fields['Phone'] || '',
      email: record.fields['Email'] || '',
      address: record.fields['Address'] || '',
      website: record.fields['Website'] || '',
      createdTime: record._rawJson.createdTime,
    };

    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/suppliers error:', error);

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
