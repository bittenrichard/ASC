// src/components/Goals/GoalModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { GoalData, AppUserObject } from '../../lib/baserowService';

interface GoalModalProps {
  isOpen: boolean;
  mode: 'edit' | 'delete';
  goal: GoalData | null;
  sdrs: AppUserObject[];
  onClose: () => void;
  onConfirm: (mode: 'edit' | 'delete', data?: any) => void;
  isSubmitting: boolean;
}

export function GoalModal({ isOpen, mode, goal, sdrs, onClose, onConfirm, isSubmitting }: GoalModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        targetValue: goal.targetValue,
        sdrId: goal.sdrId ? goal.sdrId.toString() : 'team',
      });
    }
  }, [goal]);

  if (!isOpen || !goal) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(mode, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all">
        {mode === 'edit' && (
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-primary">Editar Meta</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-background">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">Nome da Meta</label>
                <input
                  id="name" name="name" type="text" value={formData.name || ''}
                  onChange={handleInputChange} required
                  className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="targetValue" className="block text-sm font-medium text-text-primary mb-1">Valor Alvo</label>
                <input
                  id="targetValue" name="targetValue" type="number" value={formData.targetValue || ''}
                  onChange={handleInputChange} required
                  className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="sdrId" className="block text-sm font-medium text-text-primary mb-1">Atribuir a</label>
                <select id="sdrId" name="sdrId" value={formData.sdrId || 'team'} onChange={handleInputChange} className="w-full px-4 py-3 bg-background border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="team">Equipe Inteira</option>
                  {sdrs.map(sdr => <option key={sdr.id} value={sdr.id}>{sdr.name}</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 bg-background rounded-b-2xl flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="px-5 py-2.5 bg-surface border border-gray-200 rounded-lg text-text-primary font-semibold hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSubmitting ? 'A salvar...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}

        {mode === 'delete' && (
          <div>
            <div className="p-8 text-center">
              <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Excluir Meta</h2>
              <p className="text-text-secondary mt-2 max-w-sm mx-auto">
                Tem certeza que deseja excluir a meta <span className="font-bold text-text-primary">"{goal.name}"</span>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="p-6 bg-background rounded-b-2xl flex justify-center space-x-4">
              <button type="button" onClick={onClose} className="px-8 py-2.5 bg-surface border border-gray-200 rounded-lg text-text-primary font-semibold hover:bg-gray-50">
                Cancelar
              </button>
              <button type="button" onClick={() => onConfirm('delete')} disabled={isSubmitting} className="px-8 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                {isSubmitting ? 'A excluir...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}