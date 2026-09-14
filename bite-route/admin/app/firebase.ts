import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const app = firebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null;
export const adminAuth = app ? getAuth(app) : null;

export async function emailSignIn(email:string,password:string):Promise<User>{
  if(!adminAuth) throw new Error('Firebase admin dashboard credentials are not configured');
  return (await signInWithEmailAndPassword(adminAuth,email,password)).user;
}
export async function googleSignIn():Promise<User>{
  if(!adminAuth) throw new Error('Firebase admin dashboard credentials are not configured');
  return (await signInWithPopup(adminAuth,new GoogleAuthProvider())).user;
}
export async function appleSignIn():Promise<User>{
  if(!adminAuth) throw new Error('Firebase admin dashboard credentials are not configured');
  return (await signInWithPopup(adminAuth,new OAuthProvider('apple.com'))).user;
}
export async function dashboardSignOut(){if(adminAuth)await signOut(adminAuth);}
