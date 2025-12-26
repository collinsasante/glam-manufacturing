import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { verifyIdToken, getUserRole } from '@/lib/firebase-admin';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { manufacturingOrderSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

// GET /api/manufacturing - List all manufacturing records
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
    if (!hasPermission(role, Permission.VIEW_MANUFACTURING)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch manufacturing records from Airtable
    const records = await base('Manufacturing')
      .select({
        sort: [{ field: 'Created on', direction: 'desc' }],
      })
      .all();

    // 5. Transform Airtable records to clean format
    const manufacturing = records.map((record) => ({
      id: record.id,
      manufacturingId: record.fields['Manufacturing ID'] || '',
      product: record.fields['Product'] || [],
      quantity: record.fields['Quantity'] || 0,
      productionLine: record.fields['Production Line'] || '',
      createdOn: record.fields['Created on'] || '',
      status: record.fields['Status'] || '',
      notes: record.fields['Notes'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    }));

    return NextResponse.json({ data: manufacturing, count: manufacturing.length });
  } catch (error: any) {
    console.error('GET /api/manufacturing error:', error);

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

// POST /api/manufacturing - Create new manufacturing record
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
    if (!hasPermission(role, Permission.CREATE_MANUFACTURING_ORDER)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = manufacturingOrderSchema.safeParse(body);

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

    // 5. Create manufacturing record in Airtable
    const createdRecords = await base('Manufacturing').create([
      {
        fields: {
          'Manufacturing ID': validatedData.manufacturingId || '',
          'Product': validatedData.product ? [validatedData.product] : undefined,
          'Quantity': validatedData.quantity || 0,
          'Production Line': validatedData.productionLine || '',
          'Created on': validatedData.createdOn || new Date().toISOString().split('T')[0],
          'Status': validatedData.status || 'Pending',
          'Notes': validatedData.notes || '',
        },
      },
    ]);

    const record = createdRecords[0];
    const mfg = {
      id: record.id,
      manufacturingId: record.fields['Manufacturing ID'] || '',
      product: record.fields['Product'] || [],
      quantity: record.fields['Quantity'] || 0,
      productionLine: record.fields['Production Line'] || '',
      createdOn: record.fields['Created on'] || '',
      status: record.fields['Status'] || '',
      notes: record.fields['Notes'] || '',
      createdTime: record._rawJson.createdTime,
    };

    return NextResponse.json({ data: mfg }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/manufacturing error:', error);

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
