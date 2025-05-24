import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, signInWithEmail, signUpWithEmail, signInWithGoogle, logOut, db } from '../config/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login com email e senha
  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await signInWithEmail(email, password);
      toast.success('Login realizado com sucesso! ✨', {
        style: {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid #FF2C68',
        },
      });
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      let message = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          message = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          message = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        default:
          message = error.message;
      }
      
      toast.error(message, {
        style: {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid #ef4444',
        },
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registro com email e senha
  const register = async (email, password, displayName, level = 'VENDEDOR') => {
    try {
      setLoading(true);
      const result = await signUpWithEmail(email, password);
      
      // Atualizar o perfil do usuário com o nome
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }

      // Salvar dados adicionais do usuário no Firestore
      const userDoc = {
        email: result.user.email,
        displayName: displayName,
        level: level,
        createdAt: new Date().toISOString(),
        active: true
      };

      await setDoc(doc(db, 'users', result.user.uid), userDoc);
      setUserProfile(userDoc);
      
      toast.success(`Usuário ${displayName} criado como ${level}! 🎉`, {
        style: {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid #FF2C68',
        },
      });
      return result;
    } catch (error) {
      console.error('Erro no registro:', error);
      let message = 'Erro ao criar conta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Este email já está em uso';
          break;
        case 'auth/weak-password':
          message = 'A senha deve ter pelo menos 6 caracteres';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        default:
          message = error.message;
      }
      
      toast.error(message, {
        style: {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid #ef4444',
        },
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login com Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      toast.success('Login com Google realizado! 🚀', {
        style: {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid #FF2C68',
        },
      });
      return result;
    } catch (error) {
      console.error('Erro no login com Google:', error);
      toast.error('Erro ao fazer login com Google', {
        style: {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid #ef4444',
        },
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await logOut();
      toast.success('Logout realizado com sucesso! 👋', {
        style: {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid #FF2C68',
        },
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout', {
        style: {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid #ef4444',
        },
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Carregar perfil do usuário
  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserProfile(profile);
        return profile;
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
    return null;
  };

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    loadUserProfile,
    isAuthenticated: !!user,
    userLevel: userProfile?.level || null,
    isAdmin: userProfile?.level === 'ADMIN',
    isVendedor: userProfile?.level === 'VENDEDOR',
    isTecnico: userProfile?.level === 'TECNICO',
    isMarketing: userProfile?.level === 'MARKETING',
    isPosVenda: userProfile?.level === 'POS_VENDA'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 