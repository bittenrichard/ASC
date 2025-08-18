// src/lib/api.ts

import axios from 'axios';
import { toast } from 'react-hot-toast';

// VARIÁVEL DE AMBIENTE:
// Certifique-se de que a URL do seu backend está definida no arquivo .env
// Ex: VITE_BACKEND_URL=http://localhost:3000
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Serviço de API para interagir com o backend.
 * Funções que exigem comunicação com a API do Baserow de forma segura
 * devem ser roteadas por aqui para evitar problemas de CORS.
 */
export const backendService = {
  /**
   * Obtém a URL do áudio de uma chamada através de um endpoint de proxy no backend.
   * Isso contorna o problema de CORS ao buscar arquivos protegidos do Baserow.
   *
   * @param {string} fileUrl A URL protegida do arquivo de áudio no Baserow.
   * @returns {Promise<string>} Uma promessa que resolve para a URL do blob de áudio, pronta para ser usada.
   */
  async getAudioFile(fileUrl: string): Promise<string> {
    if (!BACKEND_URL) {
      const errorMsg = "A variável de ambiente VITE_BACKEND_URL não está definida. Verifique o seu arquivo .env.";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      // Fazemos a chamada para o nosso próprio backend, não para o Baserow
      const response = await axios.post(`${BACKEND_URL}/audio-proxy`, { fileUrl }, {
        responseType: 'blob' // Esperamos um Blob como resposta, que é o arquivo de áudio
      });
      
      // Criamos uma URL local para o Blob, que o navegador pode reproduzir
      return URL.createObjectURL(response.data);
      
    } catch (error: any) {
      console.error("Erro no serviço de proxy de áudio:", error);
      const errorMessage = error.response?.data?.error || "Falha ao buscar o arquivo de áudio. Verifique o console para mais detalhes.";
      throw new Error(errorMessage);
    }
  },
};