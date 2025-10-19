import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Robust, lazy initialization for Firebase Admin
function ensureFirebaseAdmin() {
  if (admin.apps.length) return;

  const tryParse = (text: string) => {
    try { return JSON.parse(text); } catch { return null; }
  };

  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').trim();
  const b64 = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 || '').trim();

  const candidates: string[] = [];
  if (raw) {
    candidates.push(raw);
    // Strip surrounding quotes if present (common mistake: wrapping JSON in single quotes)
    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
      candidates.push(raw.slice(1, -1));
    }
  }
  if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      candidates.push(decoded);
    } catch { /* ignore base64 decode errors */ }
  }

  let serviceAccount: any = null;
  for (const candidate of candidates) {
    const parsed = tryParse(candidate);
    if (parsed && typeof parsed === 'object') {
      serviceAccount = parsed;
      break;
    }
  }

  if (!serviceAccount) {
    console.error('Failed to initialize Firebase Admin: service account env is not valid JSON');
    return;
  }

  if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
    // Convert escaped newlines to actual newlines
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  try {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err);
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    ensureFirebaseAdmin();
    if (!admin.apps.length) {
      console.error('Firebase Admin not initialized - check FIREBASE_SERVICE_ACCOUNT_KEY');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    await dbConnect();
    
    const { idToken, isNewUser } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists in our database
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        email,
        name: name || email.split('@')[0],
        googleId: uid,
        profilePicture: picture,
        role: 'owner', // Default role
        isVerified: true, // Google accounts are pre-verified
        // No password for Google users initially
      });

      await user.save();
    } else {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user.googleId = uid;
        if (picture && !user.profilePicture) {
          user.profilePicture = picture;
        }
        await user.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture,
        isNewGoogleUser: !user.passwordHash, // Indicate if user needs to set a password
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
