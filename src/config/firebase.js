import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCx1wUZmMB9WjHNCwVxSy4js9puiIb98to",
  authDomain: "appgestaoiara.firebaseapp.com",
  projectId: "appgestaoiara",
  storageBucket: "appgestaoiara.firebasestorage.app",
  messagingSenderId: "281800566900",
  appId: "1:281800566900:web:4fcb6a4ce12e391fc70921",
  measurementId: "G-ET0H50Y5G5"
};

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