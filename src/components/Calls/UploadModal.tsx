// src/components/Calls/UploadModal.tsx

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Loader2, FileAudio } from 'lucide-react';
import { baserowService } from '../../lib/baserowService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const { user } = useAuth();
  const [prospectName, setProspectName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !prospectName || !user) {
      toast.error("Por favor, preencha o nome do prospecto e selecione um arquivo.");
      return;
    }

    setIsUploading(true);
    try {
      // --- LÓGICA DE UPLOAD DO ARQUIVO ---
      // AVISO: A API para o upload real do arquivo não foi especificada.
      // Por enquanto, usaremos uma URL de placeholder.
      // Em um cenário real, aqui entraria o código para enviar o `file`
      // para um serviço como Amazon S3, Google Cloud Storage ou o próprio storage do Baserow.
      const audioFileUrl = `https://placeholder.com/audio/${file.name}`;
      
      const duration = 600; // Placeholder para duração

      await baserowService.createCallRecording({
        prospect_name: prospectName,
        sdr_id: user.id,
        call_duration_seconds: duration,
        audio_file_url: audioFileUrl,
      });

      toast.success("Gravação enviada com sucesso! A análise foi iniciada.");
      onUploadComplete(); // Avisa o componente pai para recarregar os dados
      handleClose(); // Fecha o modal
    } catch (error) {
      console.error("Falha no upload da gravação:", error);
      toast.error("Não foi possível enviar a gravação. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProspectName('');
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Enviar Nova Gravação</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="prospectName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Prospecto
            </label>
            <input
              type="text"
              id="prospectName"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="Ex: João da Silva - Acme Corp"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Arquivo de Áudio
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex flex-col items-center text-gray-700">
                  <FileAudio className="w-10 h-10 mb-2 text-green-500" />
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <UploadCloud className="w-10 h-10 mb-2" />
                  <p className="font-semibold">
                    {isDragActive ? 'Solte o arquivo aqui!' : 'Arraste e solte o arquivo de áudio'}
                  </p>
                  <p className="text-sm">ou clique para selecionar</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end space-x-4">
          <button onClick={handleClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !file || !prospectName}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isUploading ? 'Enviando...' : 'Enviar para Análise'}
          </button>
        </div>
      </div>
    </div>
  );
}