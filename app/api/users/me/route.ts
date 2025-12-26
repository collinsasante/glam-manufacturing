
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getUserRole, adminDb } from '@/lib/firebase-admin';
import { UserRole } from '@/lib/rbac';
import { handleApiError } from '@/lib/errors';
export const dynamic = 'force-dynamic';

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

    // 3. Get additional user data from Firestore if available
    let userData: any = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
    };

    if (adminDb) {
      try {
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          userData = {
            ...userData,
            createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
            permissions: data?.permissions || [],
          };
        }
      } catch (error) {
        console.error('Error fetching user data from Firestore:', error);
        // Continue with basic data if Firestore fetch fails
      }
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

    // 4. Update user document in Firestore
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firestore not initialized' },
        { status: 500 }
      );
    }

    await adminDb.collection('users').doc(decodedToken.uid).set(
      {
        ...updates,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // 5. Return updated user data
    const role = await getUserRole(decodedToken.uid);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const data = userDoc.data();

    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
      permissions: data?.permissions || [],
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
