import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { userProfile } = useAuth();

  const hasPermission = (permission) => {
    if (!userProfile) return false;
    
    // ADMIN tem todas as permissões
    if (userProfile.level === 'ADMIN') return true;
    
    // Verificar se o usuário tem a permissão específica
    const userPermissions = userProfile.permissions || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canView = (resource) => {
    return hasPermission(`${resource}.view`) || hasPermission(resource);
  };

  const canCreate = (resource) => {
    return hasPermission(`${resource}.create`);
  };

  const canEdit = (resource) => {
    return hasPermission(`${resource}.edit`);
  };

  const canDelete = (resource) => {
    return hasPermission(`${resource}.delete`);
  };

  const canManage = (resource) => {
    return hasPermission(`${resource}.manage`);
  };

  // Permissões por nível padrão para fallback
  const getDefaultPermissions = () => {
    const level = userProfile?.level;
    
    switch (level) {
      case 'ADMIN':
        return 'all'; // Admin tem tudo
        
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
        return [];
    }
  };

  const hasDefaultPermission = (permission) => {
    const defaultPerms = getDefaultPermissions();
    if (defaultPerms === 'all') return true;
    return defaultPerms.includes(permission);
  };

  const checkPermission = (permission) => {
    // Primeiro verifica permissões específicas do usuário
    if (hasPermission(permission)) return true;
    
    // Se não tem permissão específica, verifica permissões padrão do nível
    return hasDefaultPermission(permission);
  };

  return {
    hasPermission: checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,
    userLevel: userProfile?.level,
    isAdmin: userProfile?.level === 'ADMIN',
    isVendedor: userProfile?.level === 'VENDEDOR',
    isTecnico: userProfile?.level === 'TECNICO',
    isMarketing: userProfile?.level === 'MARKETING',
    isPosVenda: userProfile?.level === 'POS_VENDA'
  };
}; 