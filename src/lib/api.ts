import axios from 'axios';

// A URL base da API agora vem consistentemente do .env
const API_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Função para iniciar a análise de uma chamada.
 * @param callId O ID da chamada a ser analisada.
 * @returns A resposta da API.
 */
export const analyzeCall = async (callId: number | string) => {
  try {
    // A rota no backend é '/analyze'
    const response = await axios.post(`${API_URL}/analyze`, {
      callId: callId,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao acionar a análise da chamada:', error);
    // Lançar o erro permite que o componente que chamou a função o trate (ex: exibindo um toast)
    throw error;
  }
};

/**
 * Adicione outras funções de API aqui conforme necessário.
 * Exemplo: buscar o status de uma análise.
 */
export const getAnalysisStatus = async (analysisId: string) => {
  try {
    const response = await axios.get(`${API_URL}/status/${analysisId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar status da análise:', error);
    throw error;
  }
};