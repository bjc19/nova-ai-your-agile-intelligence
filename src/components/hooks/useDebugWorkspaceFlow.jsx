/**
 * Debug utility pour tracer le flow complet du workspace selector
 * Enregistre TOUT dans sessionStorage + console
 */

const DEBUG_KEY = 'nova_workspace_debug_log';

export const debugLog = (step, data) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    step,
    data,
    stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n') // Top 3 stack frames
  };

  // Log en console
  console.log(`%c[DEBUG ${step}]`, 'color: #FF6B6B; font-weight: bold', data);

  // Enregistrer dans sessionStorage
  const logs = JSON.parse(sessionStorage.getItem(DEBUG_KEY) || '[]');
  logs.push(logEntry);
  sessionStorage.setItem(DEBUG_KEY, JSON.stringify(logs));

  return logEntry;
};

export const getDebugLogs = () => {
  return JSON.parse(sessionStorage.getItem(DEBUG_KEY) || '[]');
};

export const clearDebugLogs = () => {
  sessionStorage.removeItem(DEBUG_KEY);
};

export const printDebugReport = () => {
  const logs = getDebugLogs();
  console.group('=== 📋 COMPLETE DEBUG REPORT ===');
  logs.forEach((log, idx) => {
    console.group(`${idx + 1}. ${log.step}`);
    console.log('Time:', log.timestamp);
    console.log('Data:', log.data);
    if (log.stackTrace) console.log('Stack:', log.stackTrace);
    console.groupEnd();
  });
  console.groupEnd();
};

/**
 * Hook pour monitorer les changements de state et sessionStorage
 */
export const useDebugWorkspaceFlow = (componentName) => {
  const logStateChange = (state, newValue) => {
    debugLog(`[${componentName}] setState`, {
      state,
      newValue,
      sessionStorageWorkspaceId: sessionStorage.getItem('selectedWorkspaceId'),
      sessionStoragePeriod: sessionStorage.getItem('selectedPeriod')
    });
  };

  const logCallback = (callbackName, params) => {
    debugLog(`[${componentName}] callback: ${callbackName}`, {
      params,
      timestamp: new Date().toISOString()
    });
  };

  const logQueryKeyChange = (queryKey, previousKey) => {
    debugLog(`[${componentName}] queryKey changed`, {
      from: previousKey,
      to: queryKey,
      shouldRefetch: JSON.stringify(queryKey) !== JSON.stringify(previousKey)
    });
  };

  const logRenderCycle = (props) => {
    debugLog(`[${componentName}] render cycle`, {
      props,
      activeWorkspaceId: props.activeWorkspaceId,
      selectedWorkspaceIdInStorage: sessionStorage.getItem('selectedWorkspaceId')
    });
  };

  return {
    logStateChange,
    logCallback,
    logQueryKeyChange,
    logRenderCycle
  };
};