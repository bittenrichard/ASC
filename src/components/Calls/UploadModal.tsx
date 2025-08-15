import React, { useState, useCallback } from 'react'
import { X, Upload, File, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const { user } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prospectName, setProspectName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const acceptedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg']

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const audioFile = files.find(file => acceptedTypes.includes(file.type))
    
    if (audioFile) {
      setSelectedFile(audioFile)
    } else {
      toast.error('Por favor, selecione um arquivo de áudio válido (MP3, WAV, M4A)')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && acceptedTypes.includes(file.type)) {
      setSelectedFile(file)
    } else {
      toast.error('Por favor, selecione um arquivo de áudio válido (MP3, WAV, M4A)')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !prospectName.trim() || !user) return

    setIsUploading(true)
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = selectedFile.name.split('.').pop()
      const fileName = `${user.id}/${timestamp}.${fileExtension}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('call-recordings')
        .upload(fileName, selectedFile)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('call-recordings')
        .getPublicUrl(fileName)

      // Insert call recording record
      const { error: insertError } = await supabase
        .from('call_recordings')
        .insert({
          sdr_id: user.id,
          prospect_name: prospectName.trim(),
          audio_file_url: publicUrl,
          call_duration_seconds: 0, // Will be updated after analysis
          status: 'Processando'
        })

      if (insertError) {
        throw insertError
      }

      toast.success('Gravação enviada! A análise começará em breve.')
      onUploadSuccess()
      handleClose()
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar gravação. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setProspectName('')
    setIsDragOver(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Enviar Gravação</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <File className="h-8 w-8 text-green-600 mx-auto" />
                <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                <p className="text-xs text-green-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">
                  Arraste um arquivo de áudio aqui ou{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    clique para selecionar
                    <input
                      type="file"
                      accept=".mp3,.wav,.m4a"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">MP3, WAV, M4A até 50MB</p>
              </div>
            )}
          </div>

          {/* Prospect Name Input */}
          <div>
            <label htmlFor="prospectName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Prospecto
            </label>
            <input
              id="prospectName"
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="Ex: Acme Corp - João Silva"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !prospectName.trim() || isUploading}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Analisar Chamada</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}