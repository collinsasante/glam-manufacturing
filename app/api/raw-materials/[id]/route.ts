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

// GET /api/raw-materials/[id] - Get single raw material
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
    if (!hasPermission(role, Permission.VIEW_RAW_MATERIALS)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch raw material from Airtable
    const record = await base('Raw Materials').find(id);

    // 5. Transform to clean format
    const material = {
      id: record.id,
      materialName: record.fields['Material Name'] || '',
      specification: record.fields['Specification'] || 'Clear',
      unitOfMeasurement: record.fields['Unit of Measurement'] || '',
      unitCost: record.fields['Unit Cost'] || 0,
      currentStock: record.fields['Current Stock'] || 0,
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    };

    return NextResponse.json({ data: material });
  } catch (error: any) {
    console.error(`GET /api/raw-materials/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Raw material not found' },
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

// PATCH /api/raw-materials/[id] - Update raw material
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
    if (!hasPermission(role, Permission.UPDATE_RAW_MATERIAL)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = rawMaterialSchema.partial().safeParse(body);

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
    if (validatedData.materialName !== undefined) {
      fields['Material Name'] = validatedData.materialName;
    }
    if (validatedData.specification !== undefined) {
      fields['Specification'] = validatedData.specification;
    }
    if (validatedData.unitOfMeasurement !== undefined) {
      fields['Unit of Measurement'] = validatedData.unitOfMeasurement;
    }
    if (validatedData.unitCost !== undefined) {
      fields['Unit Cost'] = validatedData.unitCost;
    }
    if (validatedData.currentStock !== undefined) {
      fields['Current Stock'] = validatedData.currentStock;
    }

    // 6. Update raw material in Airtable
    const updatedRecords = await base('Raw Materials').update([
      {
        id: id,
        fields,
      },
    ]);

    const record = updatedRecords[0];
    const material = {
      id: record.id,
      materialName: record.fields['Material Name'] || '',
      specification: record.fields['Specification'] || 'Clear',
      unitOfMeasurement: record.fields['Unit of Measurement'] || '',
      unitCost: record.fields['Unit Cost'] || 0,
      currentStock: record.fields['Current Stock'] || 0,
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    };

    return NextResponse.json({ data: material });
  } catch (error: any) {
    console.error(`PATCH /api/raw-materials/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Raw material not found' },
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

// DELETE /api/raw-materials/[id] - Delete raw material
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
    if (!hasPermission(role, Permission.DELETE_RAW_MATERIAL)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Delete raw material from Airtable
    await base('Raw Materials').destroy([id]);

    return NextResponse.json({ success: true, message: 'Raw material deleted' });
  } catch (error: any) {
    console.error(`DELETE /api/raw-materials/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Raw material not found' },
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
