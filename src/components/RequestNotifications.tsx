import React, { useState, useEffect } from 'react';
import { subscribeToRequestAlerts, type RequestAlert } from '@/services/requestAlerts';

export const RequestNotifications: React.FC = () => {
  const [alerts, setAlerts] = useState<RequestAlert[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToRequestAlerts((newAlerts) => {
      setAlerts(newAlerts);
    });

    return unsubscribe;
  }, []);

  const getBackendColor = (backend: string): string => {
    const colors: { [key: string]: string } = {
      'SQLSERVER': '#3B82F6',  // Azul
      'POSTGRES': '#8B5CF6',   // Roxo
      'EXTRATO': '#10B981',    // Verde
      'CONTRATOS': '#F59E0B',  // Amarelo
      'IUGU': '#EF4444',       // Vermelho
    };
    return colors[backend] || '#6B7280';
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '•';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '400px',
      }}
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            marginBottom: '8px',
            padding: '12px 16px',
            background: `linear-gradient(135deg, ${getBackendColor(alert.backend)}20 0%, ${getBackendColor(alert.backend)}10 100%)`,
            border: `2px solid ${getBackendColor(alert.backend)}`,
            borderRadius: '8px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: `0 4px 12px ${getBackendColor(alert.backend)}40`,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{getStatusIcon(alert.status)}</span>
              <div>
                <div style={{ fontWeight: 'bold', color: getBackendColor(alert.backend) }}>
                  {alert.backend}
                </div>
                <div style={{ fontSize: '11px', color: '#ccc', marginTop: '2px' }}>
                  {alert.endpoint} • {alert.duration.toFixed(0)}ms
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
