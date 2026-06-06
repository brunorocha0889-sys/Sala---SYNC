import React, { useState } from "react";
import { Booking, SystemUser } from "../types";
import { 
  Download, FileText, Calendar, Filter, Lock, ShieldCheck, FileSpreadsheet, Info 
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPanelProps {
  bookings: Booking[];
  rooms: any[];
  currentUser: SystemUser;
}

export default function ExportPanel({ bookings, rooms, currentUser }: ExportPanelProps) {
  const isAdmin = currentUser.role === "Administrador";

  // Calculate default dates (start of current month, end of current month)
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const firstDay = new Date(y, m, 1).toISOString().split("T")[0];
  const lastDay = new Date(y, m + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedSituation, setSelectedSituation] = useState("all");

  // Filter Bookings locally
  const filteredBookings = bookings.filter((b) => {
    // 1. Date Range
    if (startDate && b.data < startDate) return false;
    if (endDate && b.data > endDate) return false;

    // 2. Room Selection
    if (selectedRoom !== "all") {
      const roomMatch = b.sala.toLowerCase().trim() === selectedRoom.toLowerCase().trim();
      if (!roomMatch) return false;
    }

    // 3. Situation
    if (selectedSituation !== "all") {
      if (b.situacao !== selectedSituation) return false;
    }

    return true;
  });

  // Export PDF (Available to ALL users)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Title bar
      doc.setFillColor(91, 92, 235); // Brand purple #5B5CEB
      doc.rect(0, 0, 297, 12, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("SALA-SYNC - RELATÓRIO DE RESERVAS CORPORATIVAS", 14, 8);

      // Metadata section
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Filtros Aplicados:", 14, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const startStr = startDate ? startDate.split("-").reverse().join("/") : "Filtro Inicial";
      const endStr = endDate ? endDate.split("-").reverse().join("/") : "Filtro Final";
      doc.text(`Período de Extração: ${startStr} até ${endStr}`, 14, 28);
      const matchedRoom = selectedRoom === "all" ? "Todas as salas" : selectedRoom;
      doc.text(`Sala Selecionada: ${matchedRoom}`, 14, 33);
      const matchedSit = selectedSituation === "all" ? "Todas as situações" : selectedSituation;
      doc.text(`Situação da Reserva: ${matchedSit}`, 14, 38);

      // Extra metadata right-aligned
      const generatedAt = new Date().toLocaleString("pt-BR");
      doc.text(`Data de Geração: ${generatedAt}`, 190, 28);
      doc.text(`Extraído por: ${currentUser.nome} (${currentUser.role})`, 190, 33);
      doc.text(`Total de registros: ${filteredBookings.length}`, 190, 38);

      const tableData = filteredBookings.map((b) => [
        b.data.split("-").reverse().join("/"),
        `${b.horaInicial} - ${b.horaFinal}`,
        b.sala,
        b.tempoDeUso,
        b.pessoas || "N/A",
        b.responsavel,
        b.equipamentos || "Sem material",
        b.motivo,
        b.situacao
      ]);

      autoTable(doc, {
        startY: 44,
        head: [["Data", "Horário", "Sala", "Duração", "Ocupantes", "Responsável", "Equipamentos", "Motivo", "Situação"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [91, 92, 235],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [45, 45, 45]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 35 },
          6: { cellWidth: 40 },
          7: { cellWidth: 50 },
          8: { cellWidth: 25 }
        },
        margin: { left: 14, right: 14 }
      });

      doc.save(`relatorio_reservas_${new Date().toLocaleDateString("pt-BR")}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Houve um problema ao compilar o arquivo PDF.");
    }
  };

  // Export CSV (Administrador only)
  const handleExportCSV = () => {
    if (!isAdmin) {
      alert("Operação não permitida. Apenas administradores do Setor de TI possuem permissão para realizar download de planilhas CSV.");
      return;
    }

    try {
      const headers = ["Data", "Hora Inicial", "Hora Final", "Sala", "Tempo de Uso", "Ocupantes", "Responsavel", "Equipamentos", "Motivo", "Situacao"];
      const csvRows = [headers.join(",")];
      
      filteredBookings.forEach((b) => {
        const row = [
          b.data.split("-").reverse().join("/"),
          b.horaInicial,
          b.horaFinal,
          `"${b.sala.replace(/"/g, '""')}"`,
          b.tempoDeUso,
          `"${(b.pessoas || "").replace(/"/g, '""')}"`,
          `"${b.responsavel.replace(/"/g, '""')}"`,
          `"${b.equipamentos.replace(/"/g, '""')}"`,
          `"${b.motivo.replace(/"/g, '""')}"`,
          b.situacao
        ];
        csvRows.push(row.join(","));
      });
      
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `reservas_sala_sync_${new Date().toLocaleDateString("pt-BR")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Houve um problema ao exportar a planilha CSV.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in p-1">
      
      {/* 1. Left Column: Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-1 space-y-5">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-500" />
            Parâmetros de Extração
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Refine o período e salas desejados</p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Data Inicial</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50/55 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Data Final</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50/55 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Room Choice */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Sala Específica</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/55 focus:outline-hidden focus:border-indigo-600 focus:bg-white cursor-pointer"
            >
              <option value="all">Todas as salas corporativas</option>
              {rooms.map((room) => {
                const name = room.name || room.nome;
                return (
                  <option key={room.id} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Situation Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Situação das Reservas</label>
            <select
              value={selectedSituation}
              onChange={(e) => setSelectedSituation(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/55 focus:outline-hidden focus:border-indigo-600 focus:bg-white cursor-pointer"
            >
              <option value="all">Todos os status (Confirmado / Cancelado / Finalizado)</option>
              <option value="Confirmado">Apenas Confirmados</option>
              <option value="Finalizado">Apenas Finalizados</option>
              <option value="Cancelado">Apenas Cancelados</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="font-bold uppercase text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-505" />
            Extração de Auditorias de TI
          </p>
          <p className="leading-snug">
            Filtre o período corporativo para gerar arquivos em conformidade com as regras de log empresarial do SALA-SYNC. Reservas canceladas constam do extrato para fins históricos de agendamentos solicitados.
          </p>
        </div>
      </div>

      {/* 2. Middle & Right: Actions Card Panel and Match stats */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Core Actions Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-505" />
                Opções de Download Autorizadas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Selecione o formato de relatório compatível com o seu cargo</p>
            </div>
            
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-150 uppercase tracking-wider shrink-0 font-mono">
              {filteredBookings.length} agendamentos localizados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action 1: Export PDF (All Users) */}
            <button
              onClick={handleExportPDF}
              className="border-2 border-slate-100/80 hover:border-indigo-600 rounded-2.5xl p-5 text-left transition-all hover:bg-indigo-50/5 active:scale-99 flex flex-col justify-between group cursor-pointer shadow-xs min-h-[160px]"
            >
              <div className="flex items-start justify-between w-full">
                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 transition-colors group-hover:bg-indigo-100 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                  Liberado
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
                  Exportar Relatório PDF
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                  Gera um documento diagramado em formato paisagem contendo todas as reservas filtradas, perfeito para impressão de escala física e quadros de aviso corporativos.
                </p>
              </div>
            </button>

            {/* Action 2: Export CSV (Admins Only) */}
            <button
              onClick={handleExportCSV}
              disabled={!isAdmin}
              className={`border-2 rounded-2.5xl p-5 text-left transition-all flex flex-col justify-between group min-h-[160px] ${
                isAdmin 
                  ? "border-slate-100/80 hover:border-indigo-600 hover:bg-indigo-50/5 active:scale-99 cursor-pointer shadow-xs" 
                  : "border-slate-100 bg-slate-50/60 opacity-65 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className={`p-3 rounded-2xl shrink-0 ${isAdmin ? "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100" : "bg-slate-150 text-slate-450"}`}>
                  {isAdmin ? <FileSpreadsheet className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <span className={`text-[8px] font-black border px-1.5 py-0.5 rounded uppercase tracking-wide ${
                  isAdmin 
                    ? "bg-amber-50 text-amber-800 border-amber-200" 
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  {isAdmin ? "Administrador" : "Restrito"}
                </span>
              </div>
              <div className="mt-4">
                <h4 className={`text-xs font-black uppercase tracking-wider transition-colors ${
                  isAdmin ? "text-slate-800 group-hover:text-indigo-600" : "text-slate-400"
                }`}>
                  Exportar Planilha CSV
                </h4>
                <p className={`text-[10px] mt-1 font-semibold leading-relaxed ${isAdmin ? "text-slate-400" : "text-slate-405"}`}>
                  Obtém os dados tabulares em arquivo bruto do Excel contendo todos os detalhes estruturais de cada reserva filtrada para auditorias e compilação de estatísticas adicionais.
                </p>
              </div>
            </button>
          </div>

          {/* Access Warning Banner */}
          {!isAdmin && (
            <div className="mt-6 p-4 bg-amber-50/40 border border-amber-205 rounded-2xl flex items-start gap-3">
              <Lock className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Restrição de Diretrizes corporativas</p>
                <p className="text-[10px] text-amber-700/85 font-medium leading-relaxed mt-0.5">
                  Apenas administradores de TI têm permissão para exportar planilhas CSV com dados brutos das auditorias corporativas. Seu perfil de Colaborador autoriza a extração de relatórios semanais/mensais em formato PDF de modo a manter a segurança informacional.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Data matches preview table snippet */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div>
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-3">Pré-visualização dos Registros Filtrados ({filteredBookings.length})</h4>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[220px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 font-mono text-[9px] uppercase tracking-wide">
                  <th className="p-2.5">Data/Horário</th>
                  <th className="p-2.5">Sala</th>
                  <th className="p-2.5">Responsável</th>
                  <th className="p-2.5">Equipamentos</th>
                  <th className="p-2.5">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      Nenhum agendamento localizado nesta combinação de filtros.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.slice(0, 5).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5">
                        <span className="block font-bold">{b.data.split("-").reverse().join("/")}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{b.horaInicial} - {b.horaFinal}</span>
                      </td>
                      <td className="p-2.5">{b.sala}</td>
                      <td className="p-2.5">{b.responsavel}</td>
                      <td className="p-2.5 truncate max-w-[120px]" title={b.equipamentos}>{b.equipamentos || "Nenhum"}</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          b.situacao === "Confirmado" 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-150" 
                            : b.situacao === "Finalizado" 
                            ? "bg-blue-50 text-blue-800 border border-blue-150" 
                            : "bg-slate-100 text-slate-505 border border-slate-200"
                        }`}>
                          {b.situacao}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
                {filteredBookings.length > 5 && (
                  <tr>
                    <td colSpan={5} className="p-2 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/30">
                      Mais {filteredBookings.length - 5} registros ocultos nesta pré-visualização. Baixe o relatório completo!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
    </div>
  );
}
