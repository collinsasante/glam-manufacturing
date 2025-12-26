import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { verifyIdToken, getUserRole } from '@/lib/firebase-admin';
import { hasPermission, Permission, UserRole } from '@/lib/rbac';
import { rawMaterialSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/errors';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

// GET /api/raw-materials - List all raw materials
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
    if (!hasPermission(role, Permission.VIEW_RAW_MATERIALS)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch raw materials from Airtable
    const records = await base('Raw Materials')
      .select({
        sort: [{ field: 'Material Name', direction: 'asc' }],
      })
      .all();

    // 5. Transform Airtable records to clean format
    const materials = records.map((record) => ({
      id: record.id,
      materialName: record.fields['Material Name'] || '',
      specification: record.fields['Specification'] || 'Clear',
      unitOfMeasurement: record.fields['Unit of Measurement'] || '',
      unitCost: record.fields['Unit Cost'] || 0,
      currentStock: record.fields['Current Stock'] || 0,
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    }));

    return NextResponse.json({ data: materials, count: materials.length });
  } catch (error: any) {
    console.error('GET /api/raw-materials error:', error);

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

// POST /api/raw-materials - Create new raw material
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
    if (!hasPermission(role, Permission.CREATE_RAW_MATERIAL)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = rawMaterialSchema.safeParse(body);

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

    // 5. Create raw material in Airtable
    const createdRecords = await base('Raw Materials').create([
      {
        fields: {
          'Material Name': validatedData.materialName,
          'Specification': validatedData.specification || 'Clear',
          'Unit of Measurement': validatedData.unitOfMeasurement || '',
          'Unit Cost': validatedData.unitCost || 0,
          'Current Stock': validatedData.currentStock || 0,
        },
      },
    ]);

    const record = createdRecords[0];
    const material = {
      id: record.id,
      materialName: record.fields['Material Name'] || '',
      specification: record.fields['Specification'] || 'Clear',
      unitOfMeasurement: record.fields['Unit of Measurement'] || '',
      unitCost: record.fields['Unit Cost'] || 0,
      currentStock: record.fields['Current Stock'] || 0,
      createdTime: record._rawJson.createdTime,
    };

    return NextResponse.json({ data: material }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/raw-materials error:', error);

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
