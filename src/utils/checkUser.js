import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Função para obter permissões padrão baseadas no nível do usuário
const getDefaultPermissions = (level) => {
  switch (level) {
    case 'ADMIN':
      return [
        'dashboard',
        'products.view', 'products.create', 'products.edit', 'products.delete',
        'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
        'services.view', 'services.create', 'services.edit', 'services.delete',
        'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
        'financial.view', 'financial.create', 'financial.edit',
        'reports.view', 'reports.export',
        'config.view', 'config.edit',
        'chat'
      ];
      
    case 'VENDEDOR':
      return [
        'dashboard',
        'products.view',
        'clients.view', 'clients.create', 'clients.edit',
        'sales.view', 'sales.create', 'sales.edit',
        'financial.view',
        'chat'
      ];
      
    case 'TECNICO':
      return [
        'dashboard',
        'products.view',
        'services.view', 'services.create', 'services.edit',
        'clients.view',
        'chat'
      ];
      
    case 'MARKETING':
      return [
        'dashboard',
        'clients.view',
        'reports.view', 'reports.export',
        'chat'
      ];
      
    case 'POS_VENDA':
      return [
        'dashboard',
        'clients.view', 'clients.create', 'clients.edit',
        'services.view',
        'chat'
      ];
      
    default:
      return ['dashboard']; // Permissões mínimas
  }
};

export const checkAndCreateUserDoc = async (user) => {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Verificar se é o primeiro usuário ou um email de admin
      const adminEmails = ['admin@admin.com', 'douglas@admin.com']; // Adicione emails de admin aqui
      const isFirstAdmin = adminEmails.includes(user.email.toLowerCase());
      
      // Usuário novo - definir nível baseado no email
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        level: isFirstAdmin ? 'ADMIN' : 'TECNICO', // Admin para emails especiais, TECNICO como padrão
        isActive: isFirstAdmin ? true : true, // Ativar automaticamente (o admin pode desativar depois)
        isOnline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: getDefaultPermissions(isFirstAdmin ? 'ADMIN' : 'TECNICO'),
        needsApproval: !isFirstAdmin // Apenas não-admins precisam de aprovação posterior
      };
      
      await setDoc(userDocRef, userData);
      console.log(`Documento do usuário criado com nível ${userData.level}`);
      return userData;
    } else {
      const userData = userDoc.data();
      
      // Atualizar status online
      await setDoc(userDocRef, {
        ...userData,
        isOnline: true,
        lastLogin: new Date()
      }, { merge: true });
      
      // Se não tem permissões definidas, definir baseado no nível
      if (!userData.permissions || userData.permissions.length === 0) {
        const defaultPermissions = getDefaultPermissions(userData.level || 'TECNICO');
        await setDoc(userDocRef, {
          ...userData,
          permissions: defaultPermissions,
          level: userData.level || 'TECNICO', // Define nível padrão se não existir
          updatedAt: new Date()
        }, { merge: true });
        
        return {
          ...userData,
          level: userData.level || 'TECNICO',
          permissions: defaultPermissions
        };
      }
      
      return userData;
    }
  } catch (error) {
    console.error('Erro ao verificar/criar documento do usuário:', error);
    throw error;
  }
}; 