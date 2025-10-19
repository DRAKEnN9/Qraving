import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  }
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
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
