// src/components/Calls/ManualRecordingModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Mic, StopCircle, Save, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const API_URL = import.meta.env.VITE_BACKEND_URL;

interface ManualRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export const ManualRecordingModal: React.FC<ManualRecordingModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Hook para navegação
  const [prospectName, setProspectName] = useState('');
  const [status, setStatus] = useState<'idle' | 'recording' | 'finished' | 'saving'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'recording') {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const startRecording = async () => {
    if (!prospectName.trim()) {
      toast.error('Por favor, insira o nome do prospecto.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { 
        mimeType: 'audio/webm; codecs=opus',
        audioBitsPerSecond: 128000 // Aumenta a qualidade do áudio
      });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
        setAudioBlob(blob);
        setStatus('finished');
      };
      mediaRecorderRef.current.start();
      setStatus('recording');
      setSeconds(0);
      toast.success('Gravação iniciada!');
    } catch (err) {
      toast.error('Verifique as permissões do microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSave = async () => {
    if (!audioBlob || !user) return;
    setStatus('saving');
    
    const audioFile = new File([audioBlob], `gravacao-${Date.now()}.webm`, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('prospectName', prospectName);
    formData.append('sdrId', String(user.id));
    formData.append('organizationId', String(user.organizationId));
    formData.append('duration', String(seconds));

    const uploadToast = toast.loading('A enviar gravação...');
    
    try {
      const uploadResponse = await axios.post(`${API_URL}/upload`, formData);
      const { call } = uploadResponse.data;
      
      toast.success('Upload concluído! A transcrição começará em breve.', { id: uploadToast });
      handleClose();
      navigate(`/call/${call.id}`); // Redireciona para a página de detalhes
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Ocorreu um erro desconhecido.";
      toast.error(errorMessage, { id: uploadToast });
      setStatus('finished');
    }
  };
  
  const handleClose = () => {
    stopRecording();
    setProspectName('');
    setStatus('idle');
    setSeconds(0);
    setAudioBlob(null);
    onClose();
  };

  if (!isOpen) return null;
  const isProcessing = status === 'recording' || status === 'saving';
  const formatTime = (totalSeconds: number) => `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-surface p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-text-secondary hover:text-red-500">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Gravar Nova Chamada</h2>
        
        <div className="mb-4">
          <label htmlFor="prospectNameModal" className="block text-sm font-medium text-text-secondary mb-1">Nome do Prospecto</label>
          <input
            type="text" id="prospectNameModal" value={prospectName} onChange={(e) => setProspectName(e.target.value)}
            disabled={isProcessing} placeholder="Ex: João Silva - Empresa X"
            className="w-full px-4 py-2 bg-background border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 my-6">
          <p className="text-4xl font-mono text-text-primary">{formatTime(seconds)}</p>
          <div className="flex space-x-4">
            {status !== 'recording' ? (
              <button onClick={startRecording} disabled={!prospectName.trim() || isProcessing}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/80 disabled:opacity-50">
                <Mic size={32} />
              </button>
            ) : (
              <button onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
                <StopCircle size={32} />
              </button>
            )}
            
            {status === 'finished' && (
              <button onClick={handleSave} disabled={status === 'saving'}
                className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/80 disabled:opacity-50">
                {status === 'saving' ? <Loader2 size={32} className="animate-spin" /> : <Save size={32} />}
              </button>
            )}
          </div>
          <p className="text-sm text-text-secondary italic">
            {status === 'idle' && 'Clique para iniciar.'}
            {status === 'recording' && 'Gravando...'}
            {status === 'finished' && 'Gravação finalizada. Clique em salvar.'}
            {status === 'saving' && 'A processar gravação...'}
          </p>
        </div>
        
        {status === 'finished' && audioBlob && (
          <audio controls className="w-full" src={URL.createObjectURL(audioBlob)}></audio>
        )}
      </div>
    </div>
  );
};