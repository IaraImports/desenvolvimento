import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase - usando variáveis de ambiente em produção
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCx1wUZmMB9WjHNCwVxSy4js9puiIb98to",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "appgestaoiara.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "appgestaoiara",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "appgestaoiara.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "281800566900",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:281800566900:web:4fcb6a4ce12e391fc70921",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ET0H50Y5G5"
};

// Log para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔥 Firebase Config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey.substring(0, 10) + '...' // Mascarar API key no log
  });
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Serviços do Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Providers de autenticação
export const googleProvider = new GoogleAuthProvider();

// Funções de autenticação
export const signInWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const logOut = () => {
  return signOut(auth);
};

// Funções do Firestore
export const addDocument = (collectionName, data) => {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

export const getDocuments = (collectionName, orderByField = 'createdAt') => {
  const q = query(collection(db, collectionName), orderBy(orderByField, 'desc'));
  return getDocs(q);
};

export const updateDocument = (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId);
  return updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};

export const deleteDocument = (collectionName, docId) => {
  return deleteDoc(doc(db, collectionName, docId));
};

export const getDocumentsByUser = (collectionName, userId) => {
  const q = query(
    collection(db, collectionName), 
    where('userId', '==', userId)
  );
  return getDocs(q);
};

export default app; 