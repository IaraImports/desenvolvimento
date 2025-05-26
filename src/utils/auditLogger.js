import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configurações de classificação de risco
const RISK_ASSESSMENT = {
  // Ações de baixo risco
  LOW: ['VIEW', 'SEARCH', 'EXPORT_REPORT', 'LOGIN'],
  
  // Ações de risco médio
  MEDIUM: ['CREATE', 'UPDATE', 'IMPORT_DATA', 'SEND_EMAIL'],
  
  // Ações de alto risco
  HIGH: ['DELETE', 'CHANGE_PERMISSIONS', 'SYSTEM_CONFIG', 'USER_CREATE'],
  
  // Ações críticas
  CRITICAL: ['DELETE_USER', 'SYSTEM_RESET', 'SECURITY_CHANGE', 'DATABASE_MODIFY']
};

// Categorias de auditoria
const AUDIT_CATEGORIES = {
  USER: 'user',
  SYSTEM: 'system',
  SECURITY: 'security',
  DATA: 'data',
  LOGIN: 'login',
  FINANCE: 'finance',
  SALES: 'sales',
  INVENTORY: 'inventory'
};

// Recursos do sistema
const SYSTEM_RESOURCES = {
  USERS: 'users',
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  SERVICES: 'services',
  SALES: 'sales',
  FINANCIAL: 'financial',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  AUTOMATION: 'automation',
  BACKUP: 'backup',
  AUDIT: 'audit'
};

/**
 * Determina o nível de risco de uma ação
 * @param {string} action - A ação realizada
 * @param {string} resource - O recurso afetado
 * @param {Object} context - Contexto adicional
 * @returns {string} Nível de risco (LOW, MEDIUM, HIGH, CRITICAL)
 */
const assessRiskLevel = (action, resource, context = {}) => {
  // Verificar se é uma ação crítica
  if (RISK_ASSESSMENT.CRITICAL.includes(action)) {
    return 'CRITICAL';
  }
  
  // Verificar contexto específico para ações críticas
  if (action === 'DELETE' && ['USERS', 'FINANCIAL', 'SALES'].includes(resource)) {
    return 'CRITICAL';
  }
  
  if (action === 'UPDATE' && resource === 'USERS' && context.changesPermissions) {
    return 'HIGH';
  }
  
  // Ações em recursos financeiros sempre têm risco elevado
  if (resource === 'FINANCIAL' && ['CREATE', 'UPDATE', 'DELETE'].includes(action)) {
    return 'HIGH';
  }
  
  // Verificar listas de risco
  if (RISK_ASSESSMENT.HIGH.includes(action)) {
    return 'HIGH';
  }
  
  if (RISK_ASSESSMENT.MEDIUM.includes(action)) {
    return 'MEDIUM';
  }
  
  return 'LOW';
};

/**
 * Determina a categoria da auditoria baseada no recurso e ação
 * @param {string} action - A ação realizada
 * @param {string} resource - O recurso afetado
 * @returns {string} Categoria da auditoria
 */
const determineCategory = (action, resource) => {
  if (['LOGIN', 'LOGOUT'].includes(action)) {
    return AUDIT_CATEGORIES.LOGIN;
  }
  
  if (resource === 'USERS' || action.includes('USER')) {
    return AUDIT_CATEGORIES.SECURITY;
  }
  
  if (resource === 'SETTINGS' || action.includes('SYSTEM')) {
    return AUDIT_CATEGORIES.SYSTEM;
  }
  
  if (['FINANCIAL', 'SALES'].includes(resource)) {
    return resource === 'FINANCIAL' ? AUDIT_CATEGORIES.FINANCE : AUDIT_CATEGORIES.SALES;
  }
  
  if (resource === 'PRODUCTS') {
    return AUDIT_CATEGORIES.INVENTORY;
  }
  
  return AUDIT_CATEGORIES.DATA;
};

/**
 * Obtém informações do navegador e sistema do usuário
 * @returns {Object} Informações do sistema
 */
const getSystemInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  };
};

/**
 * Obtém o endereço IP do usuário (simulado - em produção seria via API)
 * @returns {Promise<string>} Endereço IP
 */
const getUserIP = async () => {
  try {
    // Em produção, usar um serviço real de IP
    return '192.168.1.100'; // IP simulado
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Função principal de logging de auditoria
 * @param {Object} params - Parâmetros do log
 * @param {string} params.action - Ação realizada (CREATE, UPDATE, DELETE, VIEW, etc.)
 * @param {string} params.resource - Recurso afetado
 * @param {string} params.description - Descrição da ação
 * @param {Object} params.user - Dados do usuário
 * @param {Object} params.details - Detalhes adicionais
 * @param {Object} params.context - Contexto da ação
 * @returns {Promise<string>} ID do log criado
 */
export const logAuditEvent = async ({
  action,
  resource,
  description,
  user,
  details = {},
  context = {}
}) => {
  try {
    const systemInfo = getSystemInfo();
    const ipAddress = await getUserIP();
    const riskLevel = assessRiskLevel(action, resource, context);
    const category = determineCategory(action, resource);
    
    const auditLog = {
      // Informações básicas
      action,
      resource,
      description,
      category,
      riskLevel,
      
      // Informações do usuário
      userId: user?.uid || 'system',
      userEmail: user?.email || 'system',
      userDisplayName: user?.displayName || 'Sistema',
      userLevel: context.userLevel || 'unknown',
      
      // Informações técnicas
      ipAddress,
      userAgent: systemInfo.userAgent,
      platform: systemInfo.platform,
      sessionId: context.sessionId || 'unknown',
      
      // Detalhes da ação
      details: {
        ...details,
        previousValues: context.previousValues || null,
        newValues: context.newValues || null,
        affectedRecords: context.affectedRecords || 1,
        systemInfo
      },
      
      // Metadados
      timestamp: Timestamp.now(),
      source: 'web_app',
      version: '1.0.0',
      correlationId: context.correlationId || generateCorrelationId()
    };
    
    // Salvar no Firestore
    const docRef = await addDoc(collection(db, 'audit_logs'), auditLog);
    
    // Log adicional para ações críticas
    if (riskLevel === 'CRITICAL') {
      console.warn('🚨 AÇÃO CRÍTICA DETECTADA:', {
        action,
        resource,
        user: user?.email,
        timestamp: new Date().toISOString()
      });
      
      // Poderia enviar notificação para administradores
      await notifyAdministrators(auditLog);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Erro ao registrar evento de auditoria:', error);
    
    // Fallback: salvar em localStorage em caso de erro
    try {
      const fallbackLogs = JSON.parse(localStorage.getItem('audit_logs_fallback') || '[]');
      fallbackLogs.push({
        action,
        resource,
        description,
        user: user?.email,
        timestamp: new Date().toISOString(),
        error: error.message
      });
      localStorage.setItem('audit_logs_fallback', JSON.stringify(fallbackLogs.slice(-100)));
    } catch (fallbackError) {
      console.error('Erro no fallback de auditoria:', fallbackError);
    }
    
    throw error;
  }
};

/**
 * Gera um ID de correlação único
 * @returns {string} ID de correlação
 */
const generateCorrelationId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Notifica administradores sobre ações críticas
 * @param {Object} auditLog - Log de auditoria
 */
const notifyAdministrators = async (auditLog) => {
  try {
    // Implementar notificação para administradores
    // Poderia enviar email, push notification, etc.
    console.log('Notificando administradores sobre ação crítica:', auditLog);
  } catch (error) {
    console.error('Erro ao notificar administradores:', error);
  }
};

/**
 * Funções helper para diferentes tipos de ações
 */

// Login de usuário
export const logUserLogin = async (user, loginMethod = 'email') => {
  return logAuditEvent({
    action: 'LOGIN',
    resource: 'AUTHENTICATION',
    description: `Usuário ${user.email} fez login`,
    user,
    details: {
      loginMethod,
      loginTime: new Date().toISOString()
    }
  });
};

// Logout de usuário
export const logUserLogout = async (user) => {
  return logAuditEvent({
    action: 'LOGOUT',
    resource: 'AUTHENTICATION',
    description: `Usuário ${user.email} fez logout`,
    user,
    details: {
      logoutTime: new Date().toISOString()
    }
  });
};

// Criação de registro
export const logRecordCreation = async (user, resource, recordData, recordId) => {
  return logAuditEvent({
    action: 'CREATE',
    resource: resource.toUpperCase(),
    description: `Novo ${resource.toLowerCase()} criado`,
    user,
    details: {
      recordId,
      recordData: sanitizeData(recordData)
    },
    context: {
      newValues: recordData
    }
  });
};

// Atualização de registro
export const logRecordUpdate = async (user, resource, recordId, previousData, newData) => {
  return logAuditEvent({
    action: 'UPDATE',
    resource: resource.toUpperCase(),
    description: `${resource} ${recordId} atualizado`,
    user,
    details: {
      recordId,
      changedFields: getChangedFields(previousData, newData)
    },
    context: {
      previousValues: sanitizeData(previousData),
      newValues: sanitizeData(newData)
    }
  });
};

// Exclusão de registro
export const logRecordDeletion = async (user, resource, recordId, recordData) => {
  return logAuditEvent({
    action: 'DELETE',
    resource: resource.toUpperCase(),
    description: `${resource} ${recordId} excluído`,
    user,
    details: {
      recordId,
      deletedData: sanitizeData(recordData)
    },
    context: {
      previousValues: recordData
    }
  });
};

// Visualização de dados sensíveis
export const logSensitiveDataAccess = async (user, resource, recordId, dataType) => {
  return logAuditEvent({
    action: 'VIEW',
    resource: resource.toUpperCase(),
    description: `Acesso a dados sensíveis: ${dataType}`,
    user,
    details: {
      recordId,
      dataType,
      accessTime: new Date().toISOString()
    }
  });
};

// Alteração de configurações do sistema
export const logSystemConfigChange = async (user, setting, previousValue, newValue) => {
  return logAuditEvent({
    action: 'SYSTEM_CONFIG',
    resource: 'SETTINGS',
    description: `Configuração '${setting}' alterada`,
    user,
    details: {
      setting,
      previousValue: sanitizeData(previousValue),
      newValue: sanitizeData(newValue)
    },
    context: {
      previousValues: { [setting]: previousValue },
      newValues: { [setting]: newValue }
    }
  });
};

// Alteração de permissões de usuário
export const logPermissionChange = async (adminUser, targetUser, previousPermissions, newPermissions) => {
  return logAuditEvent({
    action: 'CHANGE_PERMISSIONS',
    resource: 'USERS',
    description: `Permissões do usuário ${targetUser.email} alteradas`,
    user: adminUser,
    details: {
      targetUserId: targetUser.uid,
      targetUserEmail: targetUser.email,
      previousPermissions,
      newPermissions,
      changedPermissions: getChangedFields(previousPermissions, newPermissions)
    },
    context: {
      changesPermissions: true,
      previousValues: previousPermissions,
      newValues: newPermissions
    }
  });
};

// Export de dados
export const logDataExport = async (user, resource, format, recordCount) => {
  return logAuditEvent({
    action: 'EXPORT_REPORT',
    resource: resource.toUpperCase(),
    description: `Dados exportados em formato ${format}`,
    user,
    details: {
      format,
      recordCount,
      exportTime: new Date().toISOString()
    }
  });
};

// Backup do sistema
export const logBackupOperation = async (user, operation, status, details = {}) => {
  return logAuditEvent({
    action: operation.toUpperCase(),
    resource: 'BACKUP',
    description: `Operação de backup: ${operation} - Status: ${status}`,
    user,
    details: {
      operation,
      status,
      ...details
    }
  });
};

/**
 * Funções utilitárias
 */

// Remove dados sensíveis antes do log
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'cpf', 'cnpj', 'creditCard'];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Identifica campos alterados entre dois objetos
const getChangedFields = (oldData, newData) => {
  const changes = {};
  
  if (!oldData || !newData) return changes;
  
  Object.keys(newData).forEach(key => {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        from: oldData[key],
        to: newData[key]
      };
    }
  });
  
  return changes;
};

// Recupera logs de fallback do localStorage
export const getFallbackLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('audit_logs_fallback') || '[]');
  } catch (error) {
    console.error('Erro ao recuperar logs de fallback:', error);
    return [];
  }
};

// Limpa logs de fallback
export const clearFallbackLogs = () => {
  try {
    localStorage.removeItem('audit_logs_fallback');
  } catch (error) {
    console.error('Erro ao limpar logs de fallback:', error);
  }
};

// Constantes exportadas para uso em outros módulos
export {
  AUDIT_CATEGORIES,
  SYSTEM_RESOURCES,
  RISK_ASSESSMENT
}; 