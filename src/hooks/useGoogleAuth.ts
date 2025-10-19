import { useState } from 'react';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface GoogleAuthResult {
  user: FirebaseUser;
  isNewUser: boolean;
  idToken: string;
}

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async (): Promise<GoogleAuthResult | null> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get the ID token
      const idToken = await user.getIdToken();
      
      // Check if this is a new user (you can determine this by checking if user exists in your DB)
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      return {
        user,
        isNewUser,
        idToken
      };
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups and try again.');
      } else {
        toast.error('Failed to sign in with Google');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return {
    signInWithGoogle,
    signOut,
    loading
  };
};
