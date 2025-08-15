import React from 'react'
import { Chrome, Download, Settings, Zap, Shield, Headphones } from 'lucide-react'

export function Extension() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="bg-blue-600 rounded-lg p-3">
            <Chrome className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Extensão do Navegador</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Capture e analise suas chamadas de vendas diretamente do navegador com transcrição em tempo real
        </p>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <Zap className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Em Desenvolvimento</h3>
            <p className="text-blue-700">
              Nossa extensão está sendo finalizada e estará disponível em breve na Chrome Web Store
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Headphones className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Gravação Automática</h3>
          </div>
          <p className="text-gray-600">
            Capture automaticamente o áudio de suas chamadas em plataformas como Google Meet, Zoom e Teams
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Transcrição em Tempo Real</h3>
          </div>
          <p className="text-gray-600">
            Veja a transcrição da conversa acontecendo em tempo real durante a chamada
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Análise SPIN Instantânea</h3>
          </div>
          <p className="text-gray-600">
            Receba feedback instantâneo sobre sua performance usando a metodologia SPIN Selling
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Segurança Total</h3>
          </div>
          <p className="text-gray-600">
            Todos os dados são criptografados e processados com os mais altos padrões de segurança
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Download className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Sincronização Automática</h3>
          </div>
          <p className="text-gray-600">
            Todas as gravações são automaticamente sincronizadas com sua conta no dashboard
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Chrome className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Fácil Instalação</h3>
          </div>
          <p className="text-gray-600">
            Instalação com um clique diretamente da Chrome Web Store
          </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Como Funciona</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-lg">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Instale a Extensão</h4>
            <p className="text-gray-600 text-sm">
              Baixe e instale nossa extensão gratuita da Chrome Web Store
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 font-bold text-lg">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Inicie sua Chamada</h4>
            <p className="text-gray-600 text-sm">
              A extensão detecta automaticamente quando você está em uma chamada
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 font-bold text-lg">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Receba Insights</h4>
            <p className="text-gray-600 text-sm">
              Veja análises em tempo real e acesse relatórios detalhados no dashboard
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-4">Seja o Primeiro a Saber</h3>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Cadastre-se para ser notificado assim que a extensão estiver disponível e receba acesso antecipado
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <Chrome className="h-5 w-5" />
            <span>Acessar Chrome Web Store</span>
          </a>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Notificar Quando Disponível
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Perguntas Frequentes</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">A extensão funciona com todas as plataformas de videoconferência?</h4>
            <p className="text-gray-600 text-sm">
              Sim, nossa extensão é compatível com Google Meet, Zoom, Microsoft Teams, e outras principais plataformas.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Os dados das chamadas ficam seguros?</h4>
            <p className="text-gray-600 text-sm">
              Absolutamente. Todos os dados são criptografados end-to-end e processados seguindo rigorosos padrões de segurança e privacidade.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Preciso pagar pela extensão?</h4>
            <p className="text-gray-600 text-sm">
              A extensão é gratuita para usuários do SDR Call-AI Analyzer. Funcionalidades premium podem estar disponíveis no futuro.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}