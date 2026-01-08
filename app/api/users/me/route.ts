
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getUserRole } from '@/lib/firebase-auth-edge';
import { UserRole } from '@/lib/rbac';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// GET /api/users/me - Get current user profile and role
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

    // 2. Get user role from Firestore
    const role = (await getUserRole(decodedToken.uid)) as UserRole;

    // 3. Get additional user data from Firestore REST API if available
    let userData: any = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
    };

    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${decodedToken.uid}`;

      const response = await fetch(url);
      if (response.ok) {
        const doc = await response.json();
        userData = {
          ...userData,
          createdAt: doc.fields?.createdAt?.timestampValue || null,
          permissions: doc.fields?.permissions?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        };
      }
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
      // Continue with basic data if Firestore fetch fails
    }

    return NextResponse.json({ data: userData });
  } catch (error: any) {
    console.error('GET /api/users/me error:', error);

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

// PATCH /api/users/me - Update current user profile (limited fields)
export async function PATCH(request: NextRequest) {
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

    // 2. Parse request body
    const body = await request.json();

    // 3. Users can only update specific fields (not role or permissions)
    // This could be extended to allow updating display name, avatar, etc.
    const allowedFields = ['displayName', 'avatar'];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // 4. Update user document in Firestore using REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${decodedToken.uid}`;

    // Convert updates to Firestore REST API format
    const firestoreFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      firestoreFields[key] = { stringValue: String(value) };
    }
    firestoreFields.updatedAt = { timestampValue: new Date().toISOString() };

    const updateResponse = await fetch(`${url}?updateMask.fieldPaths=${Object.keys(updates).join(',')}&updateMask.fieldPaths=updatedAt`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: firestoreFields }),
    });

    if (!updateResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    // 5. Return updated user data
    const role = await getUserRole(decodedToken.uid);
    const getResponse = await fetch(url);
    const doc = await getResponse.json();

    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
      createdAt: doc.fields?.createdAt?.timestampValue || null,
      updatedAt: doc.fields?.updatedAt?.timestampValue || null,
      permissions: doc.fields?.permissions?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
      ...updates,
    };

    return NextResponse.json({ data: userData });
  } catch (error: any) {
    console.error('PATCH /api/users/me error:', error);

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
