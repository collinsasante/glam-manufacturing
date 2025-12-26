
import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { verifyIdToken, getUserRole } from '@/lib/firebase-admin';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { stockMovementSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

// GET /api/stock-movement - List all stock movements
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
    if (!hasPermission(role, Permission.VIEW_STOCK_MOVEMENT)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch stock movements from Airtable
    const records = await base('Stock Movement')
      .select({
        sort: [{ field: 'Date', direction: 'desc' }],
      })
      .all();

    // 5. Transform Airtable records to clean format
    const movements = records.map((record) => ({
      id: record.id,
      material: record.fields['Material'] || [],
      transactionType: record.fields['Transaction Type'] || '',
      quantity: record.fields['Quantity'] || 0,
      unitCost: record.fields['Unit Cost'] || 0,
      reason: record.fields['Reason'] || '',
      from: record.fields['From'] || '',
      to: record.fields['To'] || '',
      date: record.fields['Date'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    }));

    return NextResponse.json({ data: movements, count: movements.length });
  } catch (error: any) {
    console.error('GET /api/stock-movement error:', error);

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

// POST /api/stock-movement - Create new stock movement
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
    if (!hasPermission(role, Permission.CREATE_STOCK_MOVEMENT)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = stockMovementSchema.safeParse(body);

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

    // 5. Create stock movement in Airtable
    const createdRecords = await base('Stock Movement').create([
      {
        fields: {
          'Material': validatedData.material ? [validatedData.material] : undefined,
          'Transaction Type': validatedData.transactionType,
          'Quantity': validatedData.quantity,
          'Unit Cost': validatedData.unitCost || 0,
          'Reason': validatedData.reason || '',
          'From': validatedData.from || '',
          'To': validatedData.to || '',
          'Date': validatedData.date || new Date().toISOString().split('T')[0],
        },
      },
    ]);

    const record = createdRecords[0];
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
      createdTime: record._rawJson.createdTime,
    };

    return NextResponse.json({ data: movement }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/stock-movement error:', error);

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
