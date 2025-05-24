import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { userProfile } = useAuth();

  const hasPermission = (permission) => {
    if (!userProfile) return false;
    
    // ADMIN tem todas as permissões SEMPRE
    if (userProfile.level === 'ADMIN') return true;
    
    // Verificar se o usuário tem a permissão específica
    const userPermissions = userProfile.permissions || [];
    
    // Se for um array, verificar se inclui a permissão
    if (Array.isArray(userPermissions)) {
      return userPermissions.includes(permission);
    }
    
    // Se for objeto (formato antigo), converter para compatibilidade
    if (typeof userPermissions === 'object') {
      return userPermissions[permission] === true;
    }
    
    return false;
  };

  const hasAnyPermission = (permissions) => {
    if (!userProfile) return false;
    if (userProfile.level === 'ADMIN') return true;
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    if (!userProfile) return false;
    if (userProfile.level === 'ADMIN') return true;
    return permissions.every(permission => hasPermission(permission));
  };

  const canView = (resource) => {
    if (!userProfile) return false;
    if (userProfile.level === 'ADMIN') return true;
    return hasPermission(`${resource}.view`) || hasPermission(resource);
  };

  const canCreate = (resource) => {
    if (!userProfile) return false;
    if (userProfile.level === 'ADMIN') return true;
    return hasPermission(`${resource}.create`);
  };

  const canEdit = (resource) => {
    if (!userProfile) return false;
    if (userProfile.level === 'ADMIN') return true;
    return hasPermission(`${resource}.edit`);
  };

  const canDelete = (resource) => {
    if (!userProfile) return false;
    if (userProfile.level === 'ADMIN') return true;
    return hasPermission(`${resource}.delete`);
  };

  // Verificações específicas para facilitar o uso
  const isTecnico = userProfile?.level === 'TECNICO';
  const isVendedor = userProfile?.level === 'VENDEDOR';
  const isAdmin = userProfile?.level === 'ADMIN';
  const isMarketing = userProfile?.level === 'MARKETING';
  const isPosVenda = userProfile?.level === 'POS_VENDA';

  // Funções de conveniência para recursos específicos
  const canViewClients = canView('clients');
  const canCreateClients = canCreate('clients');
  const canEditClients = canEdit('clients');
  const canDeleteClients = canDelete('clients');

  const canViewProducts = canView('products');
  const canCreateProducts = canCreate('products');
  const canEditProducts = canEdit('products');
  const canDeleteProducts = canDelete('products');

  const canViewServices = canView('services');
  const canCreateServices = canCreate('services');
  const canEditServices = canEdit('services');
  const canDeleteServices = canDelete('services');

  const canViewSales = canView('sales');
  const canCreateSales = canCreate('sales');
  const canEditSales = canEdit('sales');
  const canDeleteSales = canDelete('sales');

  const canViewFinancial = canView('financial');
  const canEditFinancial = canEdit('financial');

  const canViewReports = canView('reports');
  const canExportReports = hasPermission('reports.export');

  const canViewConfig = canView('config');
  const canEditConfig = canEdit('config');

  return {
    // Funções gerais
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canCreate,
    canEdit,
    canDelete,
    
    // Estados de usuário
    isTecnico,
    isVendedor,
    isAdmin,
    isMarketing,
    isPosVenda,
    
    // Permissões específicas por recurso
    canViewClients,
    canCreateClients,
    canEditClients,
    canDeleteClients,
    
    canViewProducts,
    canCreateProducts,
    canEditProducts,
    canDeleteProducts,
    
    canViewServices,
    canCreateServices,
    canEditServices,
    canDeleteServices,
    
    canViewSales,
    canCreateSales,
    canEditSales,
    canDeleteSales,
    
    canViewFinancial,
    canEditFinancial,
    
    canViewReports,
    canExportReports,
    
    canViewConfig,
    canEditConfig,
    
    // Informações do usuário
    userLevel: userProfile?.level,
    permissions: userProfile?.permissions || []
  };
}; 