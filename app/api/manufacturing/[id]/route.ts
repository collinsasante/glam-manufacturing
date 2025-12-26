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

// GET /api/manufacturing/[id] - Get single manufacturing record
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
    if (!hasPermission(role, Permission.VIEW_MANUFACTURING)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Fetch manufacturing record from Airtable
    const record = await base('Manufacturing').find(id);

    // 5. Transform to clean format
    const mfg = {
      id: record.id,
      batchNumber: record.fields['Batch Number'] || '',
      productName: record.fields['Product Name'] || [],
      quantityProduced: record.fields['Quantity Produced'] || 0,
      rawMaterialsUsed: record.fields['Raw Materials Used'] || [],
      productionDate: record.fields['Production Date'] || '',
      status: record.fields['Status'] || '',
      notes: record.fields['Notes'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    };

    return NextResponse.json({ data: mfg });
  } catch (error: any) {
    console.error(`GET /api/manufacturing/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Manufacturing record not found' },
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

// PATCH /api/manufacturing/[id] - Update manufacturing record
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
    if (!hasPermission(role, Permission.UPDATE_MANUFACTURING)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validationResult = manufacturingOrderSchema.partial().safeParse(body);

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
    if (validatedData.batchNumber !== undefined) {
      fields['Batch Number'] = validatedData.batchNumber;
    }
    if (validatedData.productName !== undefined) {
      fields['Product Name'] = validatedData.productName;
    }
    if (validatedData.quantityProduced !== undefined) {
      fields['Quantity Produced'] = validatedData.quantityProduced;
    }
    if (validatedData.rawMaterialsUsed !== undefined) {
      fields['Raw Materials Used'] = validatedData.rawMaterialsUsed;
    }
    if (validatedData.productionDate !== undefined) {
      fields['Production Date'] = validatedData.productionDate;
    }
    if (validatedData.status !== undefined) {
      fields['Status'] = validatedData.status;
    }
    if (validatedData.notes !== undefined) {
      fields['Notes'] = validatedData.notes;
    }

    // 6. Update manufacturing record in Airtable
    const updatedRecords = await base('Manufacturing').update([
      {
        id: id,
        fields,
      },
    ]);

    const record = updatedRecords[0];
    const mfg = {
      id: record.id,
      batchNumber: record.fields['Batch Number'] || '',
      productName: record.fields['Product Name'] || [],
      quantityProduced: record.fields['Quantity Produced'] || 0,
      rawMaterialsUsed: record.fields['Raw Materials Used'] || [],
      productionDate: record.fields['Production Date'] || '',
      status: record.fields['Status'] || '',
      notes: record.fields['Notes'] || '',
      createdTime: record.fields['Created Time'] || record._rawJson.createdTime,
    };

    return NextResponse.json({ data: mfg });
  } catch (error: any) {
    console.error(`PATCH /api/manufacturing/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Manufacturing record not found' },
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

// DELETE /api/manufacturing/[id] - Delete manufacturing record
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
    if (!hasPermission(role, Permission.DELETE_MANUFACTURING)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // 4. Delete manufacturing record from Airtable
    await base('Manufacturing').destroy([id]);

    return NextResponse.json({ success: true, message: 'Manufacturing record deleted' });
  } catch (error: any) {
    console.error(`DELETE /api/manufacturing/${id} error:`, error);

    // Handle not found
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Manufacturing record not found' },
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
