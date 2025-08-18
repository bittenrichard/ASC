// src/lib/api.ts

import axios from 'axios';
import { toast } from 'react-hot-toast';

// VARIÁVEL DE AMBIENTE:
// Certifique-se de que a URL do seu backend está definida no arquivo .env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Serviço de API para interagir com o backend.
 */
export const backendService = {
  /**
   * Obtém a URL do áudio de uma chamada através de um endpoint de proxy no backend.
   */
  async getAudioFile(fileUrl: string): Promise<string> {
    if (!BACKEND_URL) {
      const errorMsg = "A variável de ambiente VITE_BACKEND_URL não está definida. Verifique o seu arquivo .env.";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      const response = await axios.post(`${BACKEND_URL}/audio-proxy`, { fileUrl }, {
        responseType: 'blob'
      });
      
      return URL.createObjectURL(response.data);
      
    } catch (error: any) {
      console.error("Erro no serviço de proxy de áudio:", error);
      const errorMessage = error.response?.data?.error || "Falha ao buscar o arquivo de áudio. Verifique o console para mais detalhes.";
      throw new Error(errorMessage);
    }
  },
};