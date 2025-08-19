// src/components/Playbook/PlaybookRuleModal.tsx
import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';

interface PlaybookRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ruleData: { rule_type: string; keyword_trigger: string; description: string; }) => void;
  isSubmitting: boolean;
  initialData?: { rule_type: string; keyword_trigger: string; description: string; };
}

export const PlaybookRuleModal: React.FC<PlaybookRuleModalProps> = ({
  isOpen, onClose, onSave, isSubmitting, initialData
}) => {
  const [ruleType, setRuleType] = useState(initialData?.rule_type || '');
  const [keywordTrigger, setKeywordTrigger] = useState(initialData?.keyword_trigger || '');
  const [description, setDescription] = useState(initialData?.description || '');

  useEffect(() => {
    if (initialData) {
      setRuleType(initialData.rule_type);
      setKeywordTrigger(initialData.keyword_trigger);
      setDescription(initialData.description);
    } else {
      setRuleType('');
      setKeywordTrigger('');
      setDescription('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ rule_type: ruleType, keyword_trigger: keywordTrigger, description });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-surface p-8 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-200 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-red-500">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-text-primary mb-6">{initialData ? 'Editar Regra' : 'Adicionar Nova Regra'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ruleType" className="block text-sm font-medium text-text-secondary mb-1">Tipo da Regra</label>
            <select
              id="ruleType"
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-300 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Selecione um tipo...</option>
              <option value="Questionamento">Questionamento</option>
              <option value="Validação">Validação</option>
              <option value="Objeção">Objeção</option>
              <option value="Encerramento">Encerramento</option>
            </select>
          </div>

          <div>
            <label htmlFor="keywordTrigger" className="block text-sm font-medium text-text-secondary mb-1">Gatilho (Palavra-chave)</label>
            <input
              type="text"
              id="keywordTrigger"
              value={keywordTrigger}
              onChange={(e) => setKeywordTrigger(e.target.value)}
              placeholder="Ex: 'preço', 'valor', 'custo'"
              className="w-full px-4 py-2 bg-background border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="O que o SDR deve fazer quando o gatilho for acionado?"
              className="w-full px-4 py-2 bg-background border border-gray-300 rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Plus className="w-5 h-5" />}
              {initialData ? 'Salvar Alterações' : 'Adicionar Regra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};