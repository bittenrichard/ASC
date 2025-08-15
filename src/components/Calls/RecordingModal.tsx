import React, { useState, useEffect, useRef } from 'react'
import { X, Mic, Square, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordingSuccess: () => void
}

export function RecordingModal({ isOpen, onClose, onRecordingSuccess }: RecordingModalProps) {
  const { user } = useAuth()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [prospectName, setProspectName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      requestMicrophonePermission()
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isOpen])

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionGranted(true)
      
      // Stop the stream immediately, we'll create a new one when recording starts
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
      toast.error('Permissão de microfone necessária para gravar')
      setPermissionGranted(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      toast.error('Erro ao iniciar gravação')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const handleUpload = async () => {
    if (!prospectName.trim() || !user || audioChunksRef.current.length === 0) return

    setIsUploading(true)
    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      
      // Generate unique filename
      const timestamp = Date.now()
      const fileName = `${user.id}/${timestamp}_recording.wav`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('call-recordings')
        .upload(fileName, audioBlob)

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
          call_duration_seconds: recordingTime,
          status: 'Processando'
        })

      if (insertError) {
        throw insertError
      }

      toast.success('Gravação enviada! A análise começará em breve.')
      onRecordingSuccess()
      handleClose()
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar gravação. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (isRecording) {
      stopRecording()
    }
    setProspectName('')
    setRecordingTime(0)
    audioChunksRef.current = []
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gravar Chamada</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!permissionGranted ? (
            <div className="text-center py-8">
              <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Permissão de microfone necessária</p>
              <button
                onClick={requestMicrophonePermission}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Permitir Acesso ao Microfone
              </button>
            </div>
          ) : (
            <>
              {/* Recording Controls */}
              <div className="text-center space-y-4">
                <div className="text-4xl font-mono text-gray-900">
                  {formatTime(recordingTime)}
                </div>
                
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-6 rounded-full hover:bg-red-700 transition-colors mx-auto"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Iniciar Gravação</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-6 rounded-full hover:bg-gray-700 transition-colors mx-auto"
                  >
                    <Square className="h-5 w-5" />
                    <span>Parar Gravação</span>
                  </button>
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
                  disabled={isRecording}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              {/* Upload Button */}
              {recordingTime > 0 && !isRecording && (
                <button
                  onClick={handleUpload}
                  disabled={!prospectName.trim() || isUploading}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Analisar Chamada</span>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}