import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

class BiteRouteAuthService {
  FirebaseAuth get _auth => FirebaseAuth.instance;

  Stream<User?> get authStateChanges => _auth.authStateChanges();
  User? get currentUser => _auth.currentUser;

  Future<UserCredential> signInWithEmail(String email, String password) => _auth.signInWithEmailAndPassword(email: email.trim(), password: password);
  Future<UserCredential> createAccount(String email, String password) => _auth.createUserWithEmailAndPassword(email: email.trim(), password: password);

  Future<UserCredential> signInWithGoogle() async {
    final account = await GoogleSignIn().signIn();
    if (account == null) throw StateError('google_sign_in_cancelled');
    final auth = await account.authentication;
    return _auth.signInWithCredential(GoogleAuthProvider.credential(accessToken: auth.accessToken, idToken: auth.idToken));
  }

  Future<UserCredential> signInWithApple() async {
    final apple = await SignInWithApple.getAppleIDCredential(scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName]);
    final credential = OAuthProvider('apple.com').credential(idToken: apple.identityToken, accessToken: apple.authorizationCode);
    return _auth.signInWithCredential(credential);
  }

  Future<String?> apiToken() => _auth.currentUser?.getIdToken();
  Future<void> signOut() async {
    try { await GoogleSignIn().signOut(); } catch (_) {}
    await _auth.signOut();
  }
}
