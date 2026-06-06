import { useState, useMemo } from "react";
import { Booking, SystemUser } from "../types";
import { SALAS_PREDEFINIDAS, EQUIPAMENTOS_PREDEFINIDOS } from "../data";
import { 
  Search, Filter, Calendar, Users, FileText, CheckCircle, Clock, Trash2, Edit2, 
  ChevronUp, ChevronDown, PlusCircle, Ban, RefreshCw, Layers, SlidersHorizontal, EyeOff, Copy, Lock
} from "lucide-react";

interface BookingTableProps {
  bookings: Booking[];
  currentUser: SystemUser;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
  onUpdateStatus: (id: string, status: "Finalizado" | "Confirmado" | "Cancelado") => void;
  onDuplicate: (booking: Booking) => void;
}

export default function BookingTable({
  bookings,
  currentUser,
  onEdit,
  onDelete,
  onAddClick,
  onUpdateStatus,
  onDuplicate
}: BookingTableProps) {
  // Permission helper
  const isEditable = (b: Booking) => {
    if (currentUser.role === "Administrador") return true;
    // Check by user id or case-insensitive owner name
    const matchId = b.usuarioId && b.usuarioId === currentUser.id;
    const matchName = b.responsavel && b.responsavel.toLowerCase().trim() === currentUser.nome.toLowerCase().trim();
    return !!(matchId || matchName);
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Grid selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<keyof Booking>("data");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Sorting handler
  const handleSort = (field: keyof Booking) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Convert "YYYY-MM-DD" to human readable "DD/MM/YYYY" or weekday
  const formatBrazilianDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      
      const dayStr = String(day).padStart(2, "0");
      const monthStr = String(month).padStart(2, "0");
      const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      
      return `${dayStr}/${monthStr}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Get Room style matching spreadsheet
  const getRoomStyle = (roomName: string) => {
    if (roomName.includes("Escola de s") || roomName.includes("Escola de Saúde")) {
      return "bg-amber-100/80 text-amber-900 border border-amber-200 font-medium px-2.5 py-1 rounded-sm text-xs inline-flex items-center gap-1.5";
    }
    if (roomName.includes("reuniões 2")) {
      return "bg-[#1E7145] text-white font-medium px-2.5 py-1 rounded-sm text-xs inline-flex items-center gap-1.5";
    }
    if (roomName.includes("Conselho")) {
      return "bg-sky-100 text-sky-900 border border-sky-300 font-medium px-2.5 py-1 rounded-sm text-xs inline-flex items-center gap-1.5";
    }
    return "bg-purple-100 text-purple-900 border border-purple-300 font-medium px-2.5 py-1 rounded-sm text-xs inline-flex items-center gap-1.5";
  };

  // Get Equipment style matching spreadsheet
  const getEquipmentStyle = (eq: string) => {
    if (eq === "DATA SHOW/PROJETOR") {
      return "bg-[#8B4513] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded";
    }
    if (eq === "TV/COMPUTADOR") {
      return "bg-slate-800 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded";
    }
    return "bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-medium px-2 py-0.5 rounded";
  };

  // Get Status badge
  const getStatusBadge = (b: Booking) => {
    const editable = isEditable(b);
    // Rendereing an interactive select-badge to quick-update status like the spreadsheet preview
    return (
      <select
        value={b.situacao}
        onChange={(e) => onUpdateStatus(b.id, e.target.value as any)}
        disabled={!editable}
        className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 shadow-xs focus:outline-none transition-opacity ${
          !editable ? "opacity-90 cursor-not-allowed bg-slate-100 text-slate-500 border border-slate-200" : "cursor-pointer"
        } ${
          b.situacao === "Finalizado"
            ? "bg-[#5B5CEB] text-white"
            : b.situacao === "Confirmado"
            ? "bg-emerald-600 text-white"
            : "bg-rose-600 text-white"
        }`}
      >
        <option value="Confirmado">📅 Confirmado</option>
        <option value="Finalizado">✅ Finalizado</option>
        <option value="Cancelado">❌ Cancelado</option>
      </select>
    );
  };

  // Reset Filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRoom("");
    setSelectedStatus("");
    setStartDate("");
    setEndDate("");
  };

  // Filtered and Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Search Term (Responsible or Motive or Pessoas)
        const matchSearch =
          b.responsavel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (b.pessoas && b.pessoas.toLowerCase().includes(searchTerm.toLowerCase()));

        // Room
        const matchRoom = selectedRoom === "" || b.sala === selectedRoom;

        // Status
        const matchStatus = selectedStatus === "" || b.situacao === selectedStatus;

        // Date Period
        let matchDate = true;
        if (startDate) {
          matchDate = matchDate && b.data >= startDate;
        }
        if (endDate) {
          matchDate = matchDate && b.data <= endDate;
        }

        return matchSearch && matchRoom && matchStatus && matchDate;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [bookings, searchTerm, selectedRoom, selectedStatus, startDate, endDate, sortField, sortDirection]);

  // Handle Multi-Select checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredBookings.filter(isEditable).map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir as ${selectedIds.length} reservas selecionadas?`)) {
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds([]);
    }
  };

  const handleBulkStatus = (status: "Finalizado" | "Confirmado" | "Cancelado") => {
    selectedIds.forEach((id) => onUpdateStatus(id, status));
    setSelectedIds([]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      
      {/* Table Toolbar */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
        
        {/* Row 1: Add Booking and Quick search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por responsável, motivo, equipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-xs"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <div className="flex items-center bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 animate-slide-in gap-2 mr-2">
                <span>{selectedIds.length} selecionados</span>
                <span className="w-px h-4 bg-violet-200"></span>
                <button
                  onClick={() => handleBulkStatus("Finalizado")}
                  className="hover:text-violet-900 transition-colors"
                >
                  Finalizar
                </button>
                <button
                  onClick={() => handleBulkStatus("Cancelado")}
                  className="hover:text-rose-700 transition-colors text-rose-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="hover:text-rose-800 transition-colors text-rose-600"
                >
                  Excluir
                </button>
              </div>
            )}

            <button
              onClick={onAddClick}
              className="bg-violet-700 hover:bg-violet-800 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Novo Agendamento
            </button>
          </div>
        </div>

        {/* Row 2: Advanced filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          
          {/* Room Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filtrar por Sala</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todas as salas</option>
              {SALAS_PREDEFINIDAS.map((room) => (
                <option key={room.id} value={room.nome}>
                  {room.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filtrar por Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todos os status</option>
              <option value="Confirmado">📅 Confirmado</option>
              <option value="Finalizado">✅ Finalizado</option>
              <option value="Cancelado">❌ Cancelado</option>
            </select>
          </div>

          {/* Date Range - De */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">A partir de</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Date Range - Até */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Até data</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="col-span-2 sm:col-span-1 flex items-end">
            <button
              onClick={clearFilters}
              disabled={!searchTerm && !selectedRoom && !selectedStatus && !startDate && !endDate}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-50 disabled:bg-slate-50 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Limpar Filtros
            </button>
          </div>

        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          {/* Custom purple background theme for header matching the user's spreadsheet */}
          <thead>
            <tr className="bg-[#0F172A] text-white text-xs font-bold tracking-wider select-none border-b border-slate-950">
              <th className="py-3.5 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={filteredBookings.filter(isEditable).length > 0 && selectedIds.length === filteredBookings.filter(isEditable).length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-white/10"
                />
              </th>
              
              {/* Data header */}
              <th 
                className="py-3.5 px-4 cursor-pointer hover:bg-[#1E293B] transition-colors"
                onClick={() => handleSort("data")}
              >
                <div className="flex items-center gap-1">
                  COLUNA 1 (DATA)
                  {sortField === "data" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </div>
              </th>

              {/* Hora Inicial */}
              <th 
                className="py-3.5 px-3 cursor-pointer hover:bg-[#1E293B] transition-colors"
                onClick={() => handleSort("horaInicial")}
              >
                <div className="flex items-center gap-1">
                  HORA INICIAL
                  {sortField === "horaInicial" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </div>
              </th>

              {/* Hora Final */}
              <th className="py-3.5 px-3">HORA FINAL</th>

              {/* Sala */}
              <th 
                className="py-3.5 px-3 cursor-pointer hover:bg-[#1E293B] transition-colors"
                onClick={() => handleSort("sala")}
              >
                <div className="flex items-center gap-1">
                  SALA
                  {sortField === "sala" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </div>
              </th>

              {/* Tempo de Uso */}
              <th className="py-3.5 px-3">TEMPO DE USO</th>

              {/* Pessoas */}
              <th className="py-3.5 px-3">PESSOAS</th>

              {/* Responsável */}
              <th 
                className="py-3.5 px-4 cursor-pointer hover:bg-[#1E293B] transition-colors"
                onClick={() => handleSort("responsavel")}
              >
                <div className="flex items-center gap-1 px-1">
                  RESPONSÁVEL
                  {sortField === "responsavel" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </div>
              </th>

              {/* Equipamentos */}
              <th className="py-3.5 px-3">EQUIPAMENTOS</th>

              {/* Motivo */}
              <th className="py-3.5 px-4">MOTIVO</th>

              {/* Situação */}
              <th 
                className="py-3.5 px-4 cursor-pointer hover:bg-[#1E293B] transition-colors text-center"
                onClick={() => handleSort("situacao")}
              >
                <div className="flex items-center justify-center gap-1">
                  SITUAÇÃO
                  {sortField === "situacao" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </div>
              </th>

              {/* Actions */}
              <th className="py-3.5 px-4 text-center">AÇÕES</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b) => {
                const isSelected = selectedIds.includes(b.id);
                return (
                  <tr 
                    key={b.id} 
                    className={`hover:bg-slate-50/70 border-b border-slate-100/70 transition-colors ${
                      isSelected ? "bg-violet-50/40" : ""
                    } ${b.situacao === "Cancelado" ? "opacity-60 line-through text-slate-400" : ""}`}
                  >
                    {/* Checkbox select */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isEditable(b)}
                        onChange={(e) => handleSelectOne(b.id, e.target.checked)}
                        className="rounded border-slate-300 text-violet-700 focus:ring-violet-500 w-4 h-4 disabled:opacity-20 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-mono font-medium text-xs text-slate-600">
                      {formatBrazilianDate(b.data)}
                    </td>

                    {/* Hora Inicial */}
                    <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-800">
                      {b.horaInicial}
                    </td>

                    {/* Hora Final */}
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {b.horaFinal || "-"}
                    </td>

                    {/* Sala Badged */}
                    <td className="py-3 px-3">
                      <span className={getRoomStyle(b.sala)}>
                        {b.sala}
                      </span>
                    </td>

                    {/* Tempo de Uso */}
                    <td className="py-3 px-3 font-mono text-xs">
                      {b.tempoDeUso || "-"}
                    </td>

                    {/* Pessoas */}
                    <td className="py-3 px-3">
                      {b.pessoas ? (
                        <span className="bg-indigo-50 text-[#5B5CEB] border border-indigo-100 text-xs font-semibold px-2 py-0.5 rounded-sm">
                          {b.pessoas}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">-</span>
                      )}
                    </td>

                    {/* Responsável with potential own booking indicator */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span>{b.responsavel}</span>
                        {isEditable(b) && currentUser.role !== "Administrador" && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">Meu</span>
                        )}
                      </div>
                    </td>

                    {/* Equipamentos */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={getEquipmentStyle(b.equipamentos)}>
                        {b.equipamentos}
                      </span>
                    </td>

                    {/* Motivo */}
                    <td className="py-3 px-4 max-w-[200px] truncate text-xs text-slate-500 italic" title={b.motivo}>
                      {b.motivo}
                    </td>

                    {/* Situação Select Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(b)}
                    </td>

                    {/* Row Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicate(b)}
                          className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                          title="Duplicar agendamento (Copiar para outra data)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        {/* Edit / View details */}
                        <button
                          onClick={() => onEdit(b)}
                          className={`p-1 rounded transition-colors ${
                            isEditable(b)
                              ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          }`}
                          title={isEditable(b) ? "Editar Agendamento" : "Visualizar Agendamento (Somente Leitura)"}
                        >
                          {isEditable(b) ? (
                            <Edit2 className="w-4 h-4" />
                          ) : (
                            <div className="relative">
                              <Edit2 className="w-4 h-4 opacity-40 animate-pulse" />
                              <Lock className="w-2.5 h-2.5 text-amber-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
                            </div>
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (!isEditable(b)) return;
                            if (window.confirm("Deseja realmente excluir este agendamento?")) {
                              onDelete(b.id);
                            }
                          }}
                          disabled={!isEditable(b)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          title={isEditable(b) ? "Excluir" : "Excluir (Permissão Negada)"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <SlidersHorizontal className="w-8 h-8 text-slate-300 stroke-1" />
                    <p className="font-medium">Nenhum agendamento encontrado para esta pesquisa</p>
                    <p className="text-xs text-slate-400/80">Tente ajustar seus termos de busca ou filtros.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Stats */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-slate-500 gap-2">
        <p>
          Exibindo <span className="text-slate-800">{filteredBookings.length}</span> de <span className="text-slate-800">{bookings.length}</span> agendamentos no total
        </p>
        <p>Sistema baseado na planilha de agendamento de salas de reunião.</p>
      </div>

    </div>
  );
}
