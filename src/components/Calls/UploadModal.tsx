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
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.webm'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file || !prospectName || !user) return;
    setIsUploading(true);
    try {
      // 1. Enviar o arquivo e obter a referência
      const uploadedFile = await baserowService.uploadFile(file);
      
      // 2. Criar o registo da chamada com a referência do arquivo
      await baserowService.createCallRecording({
        prospectName: prospectName,
        sdrId: user.id,
        organizationId: user.organizationId,
        duration: 0, // Idealmente, obteríamos isso do arquivo
        fileData: [{ name: uploadedFile.name }],
      });

      toast.success("Gravação enviada com sucesso!");
      onUploadComplete();
      handleClose();
    } catch (error: any) {
      console.error("Falha no upload da gravação:", error);
      toast.error(error.message || "Não foi possível enviar a gravação.");
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
     <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md m-4">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-primary">Enviar Nova Gravação</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-background">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label htmlFor="prospectName" className="block text-sm font-medium text-text-primary mb-1">Nome do Prospecto</label>
            <input type="text" id="prospectName" value={prospectName} onChange={(e) => setProspectName(e.target.value)}
              placeholder="Ex: João da Silva - Acme Corp"
              className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Arquivo de Áudio</label>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}`}>
              <input {...getInputProps()} />
              {file ? (
                <div className="flex flex-col items-center text-text-primary">
                  <FileAudio className="w-12 h-12 mb-2 text-accent" />
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-xs text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-text-secondary">
                  <UploadCloud className="w-12 h-12 mb-2" />
                  <p className="font-semibold">{isDragActive ? 'Solte o arquivo aqui!' : 'Arraste e solte o arquivo'}</p>
                  <p className="text-sm">ou clique para selecionar</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 bg-background rounded-b-2xl flex justify-end space-x-4">
          <button onClick={handleClose} className="px-5 py-2.5 bg-surface border border-gray-200 rounded-lg text-text-primary font-semibold hover:bg-gray-50">Cancelar</button>
          <button onClick={handleUpload} disabled={isUploading || !file || !prospectName} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isUploading ? 'A enviar...' : 'Enviar para Análise'}
          </button>
        </div>
      </div>
    </div>
  );
}