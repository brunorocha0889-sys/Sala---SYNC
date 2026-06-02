import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Filter, 
  PlusCircle, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Calendar,
  Search,
  SlidersHorizontal
} from "lucide-react";

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeTour({ isOpen, onClose }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("tour_completed", "true");
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const tourSteps = [
    {
      title: "Boas-vindas ao SALA-SYNC!",
      badge: "Iniciando",
      icon: <Sparkles className="w-8 h-8 text-amber-500" />,
      content: "Olá! Seja muito bem-vindo ao SALA-SYNC, o seu ecossistema otimizado para o gerenciamento e ocupação de salas de reuniões e espaço corporativo. Preparamos novos recursos de inteligência de dados.",
      subContent: "Vamos fazer um rápido tour guiado pelas melhorias do sistema para que você saiba como usar a ferramenta de forma rápida e eficiente.",
      illustration: (
        <div className="relative bg-gradient-to-tr from-indigo-550/10 to-violet-550/20 dark:from-indigo-950/40 dark:to-violet-950/40 border border-slate-200/50 dark:border-slate-850 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-indigo-600/15 dark:bg-indigo-400/10 rounded-2xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-extrabold text-lg mb-3 shadow-inner">
            S2
          </div>
          <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">SALA-SYNC PLATINUM</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Tecnologia Corporativa de Alto Desempenho</p>
        </div>
      )
    },
    {
      title: "Filtro Inteligente de Planilha",
      badge: "Planilha Dinâmica",
      icon: <Filter className="w-8 h-8 text-violet-600" />,
      content: "Desenvolvemos o Filtro Inteligente diretamente em cima da aba 'Planilha Interativa'. Ele permite que você limpe o ruído e navegue livremente por toda a base de reservas com precisão instantânea.",
      subContent: "Você pode buscar por termo (nome da reunião ou responsável), por tipo de sala, o status ativo de situação, ou definir períodos específicos de datas.",
      illustration: (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl space-y-3.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <div className="w-full bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-[10px] text-slate-400 select-none flex items-center justify-between">
              <span>Buscar por responsável ou motivo...</span>
              <kbd className="text-[8px] bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700 font-mono">⌘K</kbd>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-1 px-2 border border-violet-500/30 bg-violet-50/40 dark:bg-violet-950/30 rounded-md text-[9px] text-violet-700 dark:text-violet-400 text-center font-bold">
              Todas salas
            </div>
            <div className="p-1 px-2 border border-slate-200 dark:border-slate-800 rounded-md text-[9px] text-slate-400 text-center">
              📅 Confirmado
            </div>
            <div className="p-1 px-2 border border-slate-200 dark:border-slate-800 rounded-md text-[9px] text-slate-400 text-center flex items-center justify-center gap-1">
              <SlidersHorizontal className="w-2.5 h-2.5" />
              Período
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Atalho de Novo Agendamento",
      badge: "Produtividade",
      icon: <PlusCircle className="w-8 h-8 text-indigo-500" />,
      content: "Agora existem múltiplas formas de lançar novas reservas sem carregar telas desnecessárias. O atalho principal está no topo da barra de ferramentas, mas você também pode agendar no calendário.",
      subContent: "Dica: Na aba 'Calendário Mensal', você pode clicar diretamente sobre o quadrado de um dia vazio para abrir o formulário já com a data pré-configurada automaticamente!",
      illustration: (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 text-white rounded-xl p-3 flex flex-col justify-center items-center gap-1 border border-slate-800 hover:opacity-90 cursor-default">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-md font-black">
              +
            </div>
            <p className="font-extrabold text-[10px] text-center leading-tight">Novo Agendamento</p>
            <span className="text-[7px] text-indigo-300 font-bold uppercase tracking-widest">ATALHO RÁPIDO</span>
          </div>

          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-2 font-sans flex flex-col justify-between">
            <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500">Calendário</span>
              <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold">CLIQUE EM UM DIA</span>
            </div>
            <div className="grid grid-cols-4 gap-1 pt-1.5">
              <div className="h-6 w-full rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-bold flex items-center justify-center text-slate-400">14</div>
              <div className="h-6 w-full rounded bg-slate-150 dark:bg-slate-850 border border-violet-500 text-[8px] font-extrabold text-violet-700 dark:text-violet-400 flex items-center justify-center animate-pulse">15</div>
              <div className="h-6 w-full rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-bold flex items-center justify-center text-slate-400">16</div>
              <div className="h-6 w-full rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-bold flex items-center justify-center text-slate-400">17</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Pronto para Decolar!",
      badge: "Sucesso",
      icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
      content: "Incrível! Você concluiu as boas-vindas do SALA-SYNC. Nosso servidor em tempo real irá garantir que nenhuma alteração simultânea de status colida com outras reuniões reservadas na mesma data.",
      subContent: "Use o menu superior para alternar o tema do app e gerenciar os usuários do setor de TI. Caso precise rever este tour, basta clicar na letra 'I' (ícone de informação) no painel superior ao lado do seu nome.",
      illustration: (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md">
            🚀
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">Sistema Operacional</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 leading-tight">O calendário está integrado com novas travas de colisões de horário.</p>
          </div>
        </div>
      )
    }
  ];

  const currentTourStep = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleComplete}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Modal Card wrapper */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col z-10 overflow-hidden"
      >
        {/* Upper Background Accent Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-violet-600 to-transparent opacity-80" />
        
        {/* Close Button */}
        <button
          onClick={handleComplete}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fechar introdução"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Badge */}
        <div className="flex items-center gap-2 mb-3.5">
          <span className="text-[10px] font-black tracking-widest text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full uppercase">
            {currentTourStep.badge}
          </span>
          <span className="text-slate-300 text-xs">•</span>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">
            Passo {currentStep + 1} de {tourSteps.length}
          </span>
        </div>

        {/* Main Content Animation and layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 flex-grow"
          >
            {/* Header description */}
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
                {currentTourStep.icon}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                {currentTourStep.title}
              </h2>
            </div>

            {/* Explanatory description texts */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <p className="text-slate-800 dark:text-slate-150 font-semibold text-sm">
                {currentTourStep.content}
              </p>
              {currentTourStep.subContent && (
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  {currentTourStep.subContent}
                </p>
              )}
            </div>

            {/* Illustration space */}
            <div className="pt-2">
              {currentTourStep.illustration}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Controls Footer */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* Back button */}
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 disabled:opacity-35 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {/* Dots Indicator */}
          <div className="flex gap-2">
            {tourSteps.map((_, index) => (
              <span
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? "w-6 bg-indigo-600" : "w-2 bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>

          {/* Forward / Finalize button */}
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {currentStep === tourSteps.length - 1 ? "Começar!" : "Continuar"}
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      </motion.div>
    </div>
  );
}
