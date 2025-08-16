// src/components/TeamManagement/FieldInspector.tsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function FieldInspector() {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<any[] | null>(null);
  const [error, setError] = useState('');

  const inspectFields = async () => {
    setLoading(true);
    setError('');
    setOptions(null);

    const tableId = import.meta.env.VITE_BASEROW_TABLE_USERS;
    const apiUrl = import.meta.env.VITE_BASEROW_API_URL;
    const apiToken = import.meta.env.VITE_BASEROW_API_TOKEN;

    if (!tableId || !apiUrl || !apiToken) {
      setError('Variáveis de ambiente (VITE_BASEROW_...) não encontradas no arquivo .env');
      setLoading(false);
      return;
    }

    const url = `${apiUrl}/api/database/fields/table/${tableId}/`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Token ${apiToken}` }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}. Detalhe: ${data.detail || 'Token inválido ou sem permissão.'}`);
      }
      
      const appRoleField = data.find((field: any) => field.name === 'App_Role');

      if (appRoleField && appRoleField.select_options) {
        setOptions(appRoleField.select_options);
      } else {
        setError("Campo 'App_Role' não encontrado na resposta da API.");
      }
    } catch (e: any) {
      setError(`Falha ao buscar dados: ${e.message}.`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl mt-8">
      <h3 className="text-lg font-bold text-yellow-800">Ferramenta de Depuração de Campos</h3>
      <p className="text-sm text-yellow-700 mt-1">Use este botão para encontrar os IDs das opções do campo 'App_Role'. Se isto falhar com um erro "401", o seu token no arquivo .env está inválido.</p>
      <button
        onClick={inspectFields}
        disabled={loading}
        className="mt-4 bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {loading ? 'A verificar...' : "Verificar IDs das Opções"}
      </button>

      {options && (
        <div className="mt-4">
          <p className="font-semibold text-gray-800">✅ IDs encontrados! Use estes valores no arquivo `baserowService.ts`:</p>
          <pre className="bg-gray-800 text-white p-4 rounded-lg mt-2 text-sm">
            <code>
              {`const ROLE_OPTION_IDS = {
    administrator: ${options.find(opt => opt.value === 'administrator')?.id || 'NAO_ENCONTRADO'},
    sdr: ${options.find(opt => opt.value === 'sdr')?.id || 'NAO_ENCONTRADO'},
};`}
            </code>
          </pre>
        </div>
      )}

      {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}
    </div>
  );
}