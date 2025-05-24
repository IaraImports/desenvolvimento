import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, WifiOff, Database, AlertTriangle, CheckCircle, 
  X, ChevronUp, ChevronDown, Activity, Bug, Info, AlertCircle
} from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { runSystemDiagnostics } from '../utils/systemDiagnostics';

export default function SystemMonitor() {
  const { user, userProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [systemHealth, setSystemHealth] = useState('unknown');

  // Monitorar status da conexão de rede
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addLog('Conexão de rede restaurada', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      addLog('Conexão de rede perdida', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitorar conexão com Firebase
  useEffect(() => {
    let unsubscribe;

    const testFirebaseConnection = async () => {
      try {
        // Criar um documento de teste para verificar conexão
        const testDoc = doc(db, 'system', 'connection_test');
        
        // Usar onSnapshot para monitoramento em tempo real
        unsubscribe = onSnapshot(testDoc, 
          (docSnapshot) => {
            setFirebaseConnected(true);
            if (!firebaseConnected) {
              addLog('Conexão com Firebase estabelecida', 'success');
            }
          },
          (error) => {
            setFirebaseConnected(false);
            addLog(`Erro na conexão Firebase: ${error.message}`, 'error');
          }
        );
      } catch (error) {
        setFirebaseConnected(false);
        addLog(`Erro ao conectar com Firebase: ${error.message}`, 'error');
      }
    };

    testFirebaseConnection();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Interceptar erros do console
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      addLog(`ERROR: ${args.join(' ')}`, 'error');
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      addLog(`WARNING: ${args.join(' ')}`, 'warning');
      originalWarn.apply(console, args);
    };

    // Capturar erros não tratados
    const handleError = (event) => {
      addLog(`Erro não tratado: ${event.error?.message || event.message}`, 'error');
    };

    const handleUnhandledRejection = (event) => {
      addLog(`Promise rejeitada: ${event.reason}`, 'error');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Log inicial do sistema
    addLog('Sistema iniciado com sucesso', 'success');

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const addLog = (message, type = 'info') => {
    const newLog = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString('pt-BR')
    };

    setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Manter apenas os últimos 50 logs
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (!firebaseConnected) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!firebaseConnected) return 'Firebase Desconectado';
    return 'Online';
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-3 h-3 text-red-400" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-3 h-3 text-green-400" />;
      default: return <Info className="w-3 h-3 text-blue-400" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-300 bg-red-500/10';
      case 'warning': return 'text-yellow-300 bg-yellow-500/10';
      case 'success': return 'text-green-300 bg-green-500/10';
      default: return 'text-blue-300 bg-blue-500/10';
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs limpos', 'info');
  };

  const runDiagnostics = async () => {
    addLog('Executando diagnóstico do sistema...', 'info');
    try {
      const results = await runSystemDiagnostics(user, userProfile);
      setSystemHealth(results.status);
      
      if (results.status === 'healthy') {
        addLog('✅ Sistema funcionando corretamente!', 'success');
      } else {
        addLog(`⚠️ Problemas encontrados: ${results.criticalIssues.join(', ')}`, 'warning');
      }
      
      // Log detalhado dos resultados
      addLog(`Firebase: ${results.firebase.connected ? 'Conectado' : 'Desconectado'}`, 
        results.firebase.connected ? 'success' : 'error');
      
      if (results.dependencies.missingDependencies.length > 0) {
        addLog(`Dependências faltando: ${results.dependencies.missingDependencies.join(', ')}`, 'error');
      }
      
    } catch (error) {
      addLog(`Erro no diagnóstico: ${error.message}`, 'error');
      setSystemHealth('critical');
    }
  };

  return (
    <>
      {/* Indicador de status fixo no canto inferior direito */}
      <div className="fixed bottom-4 right-4 z-50">
        <motion.div
          className="bg-[#0D0C0C]/90 backdrop-blur-sm border border-[#FF2C68]/30 rounded-lg p-2 shadow-lg"
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="w-3 h-3 text-white/60" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <Database className={`w-3 h-3 ${firebaseConnected ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <span className="text-xs text-white/80">{getStatusText()}</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-white/60" />
              ) : (
                <ChevronUp className="w-3 h-3 text-white/60" />
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Painel expandido de logs */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-4 w-96 max-h-80 bg-[#0D0C0C]/95 backdrop-blur-sm border border-[#FF2C68]/30 rounded-xl shadow-2xl z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[#FF2C68]" />
                  <h3 className="text-sm font-medium text-white">Monitor do Sistema</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={runDiagnostics}
                    className="text-xs text-[#FF2C68] hover:text-[#FF2C68]/80 transition-colors"
                    title="Executar diagnóstico"
                  >
                    Diagnóstico
                  </button>
                  <button
                    onClick={clearLogs}
                    className="text-xs text-white/60 hover:text-white transition-colors"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={() => setExpanded(false)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#FF2C68]/10 border border-[#FF2C68]/20 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-green-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-xs text-white/80">
                      Rede: {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="bg-[#FF2C68]/10 border border-[#FF2C68]/20 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <Database className={`w-3 h-3 ${firebaseConnected ? 'text-green-400' : 'text-red-400'}`} />
                    <span className="text-xs text-white/80">
                      Firebase: {firebaseConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="text-center py-4">
                    <Bug className="w-6 h-6 text-white/30 mx-auto mb-2" />
                    <p className="text-xs text-white/60">Nenhum log registrado</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded-lg text-xs ${getLogColor(log.type)}`}
                    >
                      <div className="flex items-start space-x-2">
                        {getLogIcon(log.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{log.message}</span>
                            <span className="text-xs opacity-60 ml-2">{log.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #FF2C68 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #FF2C68;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #FF2C68;
        }
      `}</style>
    </>
  );
} 