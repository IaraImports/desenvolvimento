// Utilitários para diagnóstico do sistema

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Verificar se todas as dependências estão instaladas
export const checkDependencies = () => {
  const requiredDependencies = [
    'react',
    'react-dom',
    'react-router-dom',
    'firebase',
    'framer-motion',
    'lucide-react',
    'react-hot-toast'
  ];

  const missingDependencies = [];
  
  requiredDependencies.forEach(dep => {
    try {
      require(dep);
    } catch (error) {
      missingDependencies.push(dep);
    }
  });

  return {
    allInstalled: missingDependencies.length === 0,
    missingDependencies
  };
};

// Verificar conexão com Firebase
export const checkFirebaseConnection = async () => {
  try {
    // Tentar criar/atualizar um documento de teste
    const testDoc = doc(db, 'system', 'health_check');
    await setDoc(testDoc, {
      timestamp: new Date(),
      status: 'connected'
    });

    // Tentar ler o documento
    const docSnap = await getDoc(testDoc);
    
    return {
      connected: docSnap.exists(),
      firestore: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      connected: false,
      firestore: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Verificar coleções necessárias no Firebase
export const checkFirebaseCollections = async () => {
  const requiredCollections = [
    'clientes',
    'produtos',
    'vendas',
    'servicos',
    'notifications',
    'users'
  ];

  const collectionStatus = {};

  for (const collection of requiredCollections) {
    try {
      const testDoc = doc(db, collection, 'test');
      await getDoc(testDoc);
      collectionStatus[collection] = 'accessible';
    } catch (error) {
      collectionStatus[collection] = `error: ${error.message}`;
    }
  }

  return collectionStatus;
};

// Verificar variáveis de ambiente necessárias
export const checkEnvironmentVariables = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const envStatus = {};
  
  requiredEnvVars.forEach(envVar => {
    envStatus[envVar] = import.meta.env[envVar] ? 'set' : 'missing';
  });

  return envStatus;
};

// Verificar permissões do usuário
export const checkUserPermissions = (user, userProfile) => {
  return {
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
    userLevel: userProfile?.level || 'unknown',
    permissions: {
      canManageClients: ['ADMIN', 'VENDEDOR', 'MARKETING', 'POS_VENDA'].includes(userProfile?.level),
      canManageProducts: ['ADMIN', 'VENDEDOR', 'TECNICO'].includes(userProfile?.level),
      canManageSales: ['ADMIN', 'VENDEDOR'].includes(userProfile?.level),
      canViewReports: ['ADMIN', 'MARKETING'].includes(userProfile?.level),
      canManageSettings: ['ADMIN'].includes(userProfile?.level)
    }
  };
};

// Executar diagnóstico completo do sistema
export const runSystemDiagnostics = async (user, userProfile) => {
  console.log('🔍 Iniciando diagnóstico do sistema...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    dependencies: checkDependencies(),
    environment: checkEnvironmentVariables(),
    user: checkUserPermissions(user, userProfile)
  };

  try {
    diagnostics.firebase = await checkFirebaseConnection();
    diagnostics.collections = await checkFirebaseCollections();
  } catch (error) {
    diagnostics.firebase = { error: error.message };
    diagnostics.collections = { error: 'Unable to check collections' };
  }

  // Log do diagnóstico
  console.log('📊 Diagnóstico do Sistema:', diagnostics);

  // Verificar problemas críticos
  const criticalIssues = [];
  
  if (!diagnostics.dependencies.allInstalled) {
    criticalIssues.push(`Dependências faltando: ${diagnostics.dependencies.missingDependencies.join(', ')}`);
  }
  
  if (!diagnostics.firebase.connected) {
    criticalIssues.push('Não foi possível conectar ao Firebase');
  }
  
  if (!diagnostics.user.isAuthenticated) {
    criticalIssues.push('Usuário não autenticado');
  }

  if (criticalIssues.length > 0) {
    console.error('🚨 Problemas críticos encontrados:', criticalIssues);
  } else {
    console.log('✅ Sistema funcionando corretamente!');
  }

  return {
    ...diagnostics,
    criticalIssues,
    status: criticalIssues.length === 0 ? 'healthy' : 'critical'
  };
};

// Função para corrigir problemas comuns
export const autoFixCommonIssues = async () => {
  const fixes = [];
  
  try {
    // Tentar inicializar coleções necessárias
    const collections = ['clientes', 'produtos', 'vendas', 'servicos', 'notifications'];
    
    for (const collectionName of collections) {
      try {
        const initDoc = doc(db, collectionName, '_init');
        await setDoc(initDoc, {
          _initialized: true,
          createdAt: new Date()
        });
        fixes.push(`Coleção ${collectionName} inicializada`);
      } catch (error) {
        console.warn(`Não foi possível inicializar ${collectionName}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Erro ao executar correções automáticas:', error);
  }
  
  return fixes;
};

export default {
  checkDependencies,
  checkFirebaseConnection,
  checkFirebaseCollections,
  checkEnvironmentVariables,
  checkUserPermissions,
  runSystemDiagnostics,
  autoFixCommonIssues
}; 