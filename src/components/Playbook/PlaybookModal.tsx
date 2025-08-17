// src/components/Playbook/PlaybookModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';

interface PlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isSubmitting: boolean;
}

export function PlaybookModal({ isOpen, onClose, onSave, isSubmitting }: PlaybookModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (!isOpen) setName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg m-4">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-primary">Novo Playbook</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-background">
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
          <div className="p-8">
            <label htmlFor="playbookName" className="block text-sm font-medium text-text-primary mb-1">
              Nome do Playbook
            </label>
            <input
              id="playbookName"
              name="playbookName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Playbook de Qualificação Inicial"
              className="w-full px-4 py-3 bg-background border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="p-6 bg-background rounded-b-2xl flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-surface border border-gray-200 rounded-lg text-text-primary font-semibold hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || !name.trim()} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSubmitting ? 'A criar...' : 'Criar Playbook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}