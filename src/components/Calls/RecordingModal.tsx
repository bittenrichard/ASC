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

  useEffect(() => { /* ... (sem alterações) ... */ }, [isOpen]);
  const startRecording = async () => { /* ... (sem alterações) ... */ };
  const stopRecording = () => { /* ... (sem alterações) ... */ };

  const handleSave = async () => {
    if (!audioBlob || !prospectName || !user) return;
    setIsUploading(true);
    try {
      const audioFile = new File([audioBlob], `gravacao-${Date.now()}.webm`, { type: 'audio/webm' });
      const uploadedFile = await baserowService.uploadFile(audioFile);
      
      await baserowService.createCallRecording({
        prospectName: prospectName,
        sdrId: user.id,
        organizationId: user.organizationId,
        duration: timer,
        fileData: [{ name: uploadedFile.name }],
      });

      toast.success("Gravação salva com sucesso!");
      onUploadComplete();
      handleClose();
    } catch (error: any) {
      console.error("Falha ao salvar a gravação:", error);
      toast.error(error.message || "Não foi possível salvar a gravação.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    stopRecording();
    setProspectName('');
    setTimer(0);
    setAudioBlob(null);
    onClose();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md m-4">
        {/* ... (JSX do modal sem alterações na estrutura, apenas na função handleSave) ... */}
      </div>
    </div>
  );
}