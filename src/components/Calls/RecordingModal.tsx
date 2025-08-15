// src/components/Calls/RecordingModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { baserowService } from '../../lib/baserowService';
import toast from 'react-hot-toast';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export function RecordingModal({ isOpen, onClose, onUploadComplete }: RecordingModalProps) {
  const { user } = useAuth();
  const [prospectName, setProspectName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reseta o estado quando o modal abre
      setProspectName('');
      setIsRecording(false);
      setIsUploading(false);
      setTimer(0);
      setAudioBlob(null);
    } else {
      // Garante que a gravação e o timer parem se o modal for fechado abruptamente
      stopRecording();
    }
  }, [isOpen]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Libera o microfone
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Erro ao acessar o microfone:", error);
      toast.error("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if(timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleSave = async () => {
    if (!audioBlob || !prospectName || !user) {
      toast.error("Por favor, preencha o nome do prospecto.");
      return;
    }

    setIsUploading(true);
    try {
      // --- AVISO: LÓGICA DE UPLOAD DO ARQUIVO ---
      // Assim como no upload manual, esta é uma URL de placeholder.
      const audioFileUrl = `https://placeholder.com/audio/recording-${Date.now()}.webm`;
      
      await baserowService.createCallRecording({
        prospect_name: prospectName,
        sdr_id: user.id,
        call_duration_seconds: timer,
        audio_file_url: audioFileUrl,
      });

      toast.success("Gravação salva com sucesso! A análise foi iniciada.");
      onUploadComplete();
      handleClose();
    } catch (error) {
      console.error("Falha ao salvar a gravação:", error);
      toast.error("Não foi possível salvar a gravação. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    stopRecording();
    onClose();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Gravar Nova Chamada</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-8 space-y-6 flex flex-col items-center">
            <div className="text-4xl font-mono text-gray-800 tracking-wider">
                {formatTime(timer)}
            </div>
            
            {!audioBlob ? (
                 <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors
                        ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                 >
                    {isRecording 
                        ? <Square className="w-8 h-8 text-white" fill="white" /> 
                        : <Mic className="w-10 h-10 text-white" />}
                 </button>
            ) : (
                <div className="text-center text-green-600 font-medium">
                    <p>Gravação finalizada!</p>
                    <p className="text-sm">Preencha o nome do prospecto para salvar.</p>
                </div>
            )}
           
            <div className="w-full pt-4">
                <label htmlFor="prospectNameRecord" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Prospecto
                </label>
                <input
                    type="text"
                    id="prospectNameRecord"
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    placeholder="Ex: Maria Souza - InovaTech"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isRecording}
                />
            </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end space-x-4">
          <button onClick={handleClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading || isRecording || !audioBlob || !prospectName}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isUploading ? 'Salvando...' : 'Salvar Gravação'}
          </button>
        </div>
      </div>
    </div>
  );
}