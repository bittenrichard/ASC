// src/components/CallDetails/CrmSync.tsx
import React, { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { baserowService } from '../../lib/baserowService';

interface CrmSyncProps {
  callId: number;
}

export function CrmSync({ callId }: CrmSyncProps) {
  const [loadingCrm, setLoadingCrm] = useState<string | null>(null);

  const handleSync = async (crm: 'salesforce' | 'hubspot') => {
    setLoadingCrm(crm);
    try {
      if (crm === 'salesforce') {
        await baserowService.syncCallToSalesforce(callId, { token: 'fake_sf_token' });
      } else if (crm === 'hubspot') {
        await baserowService.syncCallToHubspot(callId, { apiKey: 'fake_hs_key' });
      }
    } finally {
      setLoadingCrm(null);
    }
  };

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <Share2 className="w-5 h-5" />
        Sincronizar com CRM
      </h3>
      <div className="space-y-3">
        <button
          onClick={() => handleSync('hubspot')}
          disabled={!!loadingCrm}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-60"
        >
          {loadingCrm === 'hubspot' ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Enviar para HubSpot
        </button>
        <button
          onClick={() => handleSync('salesforce')}
          disabled={!!loadingCrm}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-60"
        >
          {loadingCrm === 'salesforce' ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Enviar para Salesforce
        </button>
      </div>
    </div>
  );
}