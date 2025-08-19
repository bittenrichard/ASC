// src/components/Calls/ManualRecordingModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Mic, StopCircle, Save, X } from 'lucide-react';
import { baserowService } from '../../lib/baserowService';

interface ManualRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingSaved: (audioBlob: Blob, prospectName: string, callDate: string, sdrId: number, callDurationSeconds: number) => void;
  sdrId: number;
}

export const ManualRecordingModal: React.FC<ManualRecordingModalProps> = ({ isOpen, onClose, onRecordingSaved, sdrId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [prospectName, setProspectName] = useState('');
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioURL, setAudioURL] = useState('');
  const [status, setStatus] = useState<'idle' | 'recording' | 'finished' | 'saving'>('idle');
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'recording') {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  const startRecording = async () => {
    if (status !== 'idle' && status !== 'finished') return;
    if (!prospectName.trim()) {
      toast.error('Por favor, insira o nome do prospecto antes de gravar.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setStatus('finished');
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioChunks([]);
      setStatus('recording');
      setSeconds(0);
      toast.success('Gravação iniciada!');
    } catch (err) {
      console.error('Erro ao acessar o microfone:', err);
      toast.error('Não foi possível iniciar a gravação. Verifique as permissões do microfone.');
      setIsRecording(false);
      setStatus('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSave = () => {
    if (status !== 'finished' || audioChunks.length === 0) {
      toast.error('Nenhuma gravação para salvar.');
      return;
    }
    setStatus('saving');
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const callDate = new Date().toISOString();
    onRecordingSaved(audioBlob, prospectName, callDate, sdrId, seconds);
    resetStateAndClose();
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const resetStateAndClose = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioChunks([]);
    setAudioURL('');
    setProspectName('');
    setStatus('idle');
    setSeconds(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-surface p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200 relative">
        <button onClick={resetStateAndClose} className="absolute top-4 right-4 text-text-secondary hover:text-red-500">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Gravar Nova Chamada</h2>
        
        <div className="mb-4">
          <label htmlFor="prospectName" className="block text-sm font-medium text-text-secondary mb-1">Nome do Prospecto</label>
          <input
            type="text"
            id="prospectName"
            value={prospectName}
            onChange={(e) => setProspectName(e.target.value)}
            disabled={isRecording}
            placeholder="Ex: João Silva - Empresa X"
            className="w-full px-4 py-2 bg-background border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 my-6">
          <p className="text-4xl font-mono text-text-primary">{formatTime(seconds)}</p>
          
          <div className="flex space-x-4">
            {status === 'idle' || status === 'finished' ? (
              <button
                onClick={startRecording}
                disabled={status === 'saving' || !prospectName.trim()}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mic size={32} />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                disabled={status === 'saving'}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <StopCircle size={32} />
              </button>
            )}
            
            {status === 'finished' && (
              <button
                onClick={handleSave}
                disabled={status === 'saving'}
                className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'saving' ? <Loader2 size={32} className="animate-spin" /> : <Save size={32} />}
              </button>
            )}
          </div>
          
          <p className="text-sm text-text-secondary italic">
            {status === 'idle' && 'Clique para iniciar a gravação.'}
            {status === 'recording' && 'Gravando...'}
            {status === 'finished' && 'Gravação finalizada. Salve ou inicie uma nova.'}
            {status === 'saving' && 'Salvando gravação...'}
          </p>
        </div>
        
        {status === 'finished' && audioURL && (
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2 text-text-primary">Pré-visualização do Áudio:</h4>
            <audio controls className="w-full" src={audioURL}></audio>
          </div>
        )}
      </div>
    </div>
  );
};