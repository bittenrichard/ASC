import React, { useState } from 'react';
import { Mic, Zap, AlertTriangle } from 'lucide-react';

const Popup = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("Aguardando início da chamada...");
    const [suggestion, setSuggestion] = useState(null);

    return (
        <div className="w-80 p-4 bg-background font-sans text-text-primary">
            <h1 className="font-bold text-center">Copiloto SDR</h1>
            <div className="my-4 h-32 p-2 bg-surface rounded-lg overflow-y-auto text-sm">
                {transcript}
            </div>
            {suggestion && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <h3 className="font-bold text-sm flex items-center gap-2"><Zap className="w-4 h-4" /> Sugestão</h3>
                    <p className="text-xs mt-1">{suggestion}</p>
                </div>
            )}
            <button className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white font-semibold ${isRecording ? 'bg-red-500' : 'bg-primary'}`}>
                <Mic className="w-5 h-5" />
                {isRecording ? "Gravação em Andamento" : "Iniciar Gravação"}
            </button>
        </div>
    );
};

export default Popup;