import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const dbPath = databaseUrl.startsWith("file:") ? databaseUrl.substring(5) : databaseUrl;
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory session store
const sessions = new Map<string, { userId: string; role: string; nome: string; email: string; setor: string }>();

// Helper to parse time string to minutes
function parseTimeToMinutes(tStr: string): number {
  if (!tStr) return 0;
  const parts = tStr.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

// Authentication Middleware
function getSessionUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return sessions.get(token);
  }
  return null;
}

const authenticate: express.RequestHandler = (req: any, res, next) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Sessão não autenticada. Por favor, faça login." });
  }
  req.user = user;
  next();
};

const requireAdmin: express.RequestHandler = (req: any, res, next) => {
  authenticate(req, res, () => {
    if (req.user.role !== "Administrador") {
      return res.status(403).json({ error: "Acesso negado: Apenas administradores do Setor de TI podem realizar esta operação." });
    }
    next();
  });
};

let isAutoFinalizing = false;
let lastFinalizedTime = 0;

// Auto-finalize bookings that are past their scheduled end times in the database
async function runAutoFinalizer() {
  const nowMs = Date.now();
  if (isAutoFinalizing || nowMs - lastFinalizedTime < 30000) {
    return;
  }
  
  isAutoFinalizing = true;
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
    
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    const result = await prisma.booking.updateMany({
      where: {
        situacao: "Confirmado",
        OR: [
          {
            data: { lt: todayStr }
          },
          {
            data: { equals: todayStr },
            horaFinal: { lt: currentTimeStr }
          }
        ]
      },
      data: {
        situacao: "Finalizado"
      }
    });

    if (result.count > 0) {
      console.log(`[Auto-Finalizador] ${result.count} reserva(s) finalizada(s) automaticamente.`);
    }
    lastFinalizedTime = Date.now();
  } catch (err) {
    console.error("Erro no Auto-Finalizador de reservas:", err);
  } finally {
    isAutoFinalizing = false;
  }
}

// Check every 15 seconds
setInterval(runAutoFinalizer, 15000);

// Helper function to check equipment availability conflicts
async function getEquipmentConflict(
  bookingId: string | undefined,
  data: string,
  horaInicial: string,
  horaFinal: string,
  requestedReqs: { equipmentId: string; quantidade: number }[]
): Promise<{ error?: string; conflictBooking?: any } | null> {
  const startMin = parseTimeToMinutes(horaInicial);
  const endMin = parseTimeToMinutes(horaFinal);

  for (const reqEq of requestedReqs) {
    if (reqEq.quantidade <= 0) continue;

    const eqItem = await prisma.equipment.findUnique({ where: { id: reqEq.equipmentId } });
    if (!eqItem) continue;
    if (!eqItem.ativo) {
      return { error: `O equipamento "${eqItem.nome}" está desativado no momento e não pode ser solicitado.` };
    }

    // Find all overlapping confirmed bookings on the same date
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        data,
        situacao: "Confirmado",
        NOT: bookingId ? { id: bookingId } : undefined
      },
      include: {
        equipmentsRequested: {
          include: {
            equipment: true
          }
        }
      }
    });

    let concurrentAllocated = 0;
    let conflictBooking: any = null;

    for (const b of overlappingBookings) {
      const otherStart = parseTimeToMinutes(b.horaInicial);
      const otherEnd = parseTimeToMinutes(b.horaFinal);

      if (startMin < otherEnd && endMin > otherStart) {
        const match = b.equipmentsRequested.find(er => er.equipmentId === reqEq.equipmentId);
        if (match) {
          concurrentAllocated += match.quantidade;
          conflictBooking = b;
        }
      }
    }

    if (concurrentAllocated + reqEq.quantidade > eqItem.quantidade) {
      const conflictMsg = conflictBooking 
        ? `na reserva de "${conflictBooking.responsavel}" das ${conflictBooking.horaInicial} às ${conflictBooking.horaFinal}`
        : "em reserva concomitante";
      return {
        error: `O equipamento "${eqItem.nome}" não está disponível na quantidade solicitada para este período. Restam apenas ${eqItem.quantidade - concurrentAllocated} de ${eqItem.quantidade} unidades disponíveis (conflito ${conflictMsg}).`,
        conflictBooking
      };
    }
  }
  return null;
}

// Bootstrap database with default categories, users and equipments
async function bootstrap() {
  try {
    // 1. Seed Sectors
    const sectorCount = await prisma.sector.count();
    const defaultSectors = ["TI", "Qualidade", "Faturamento", "Fisioterapia", "Enfermagem", "Financeiro", "Recursos Humanos", "Diretoria"];
    if (sectorCount === 0) {
      for (const name of defaultSectors) {
        await prisma.sector.create({ data: { nome: name } });
      }
      console.log("[Bootstrap] Setores padrão criados.");
    }

    // Retrieve default sector reference
    const tiSector = await prisma.sector.findUnique({ where: { nome: "TI" } });
    const tiSectorId = tiSector ? tiSector.id : null;

    // 2. Admin & Default Users
    const adminCount = await prisma.user.count({ where: { email: "admin@sala-sync.com" } });
    if (adminCount === 0) {
      await prisma.user.create({
        data: {
          id: "user-admin",
          nome: "Admin",
          email: "admin@sala-sync.com",
          senha: "123456",
          role: "Administrador",
          setor: "TI",
          setorId: tiSectorId,
          avatarUrl: "AD"
        }
      });
      console.log("[Bootstrap] Usuário Administrador de teste criado.");
    }

    // Fix other users missing sector relationship
    const unlinkedUsers = await prisma.user.findMany({ where: { setorId: null } });
    for (const u of unlinkedUsers) {
      const match = await prisma.sector.findUnique({ where: { nome: u.setor } });
      if (match) {
        await prisma.user.update({
          where: { id: u.id },
          data: { setorId: match.id }
        });
      } else {
        // Link to general TI
        await prisma.user.update({
          where: { id: u.id },
          data: { setorId: tiSectorId }
        });
      }
    }

    // 3. Rooms seeding is disabled; rooms are created exclusively via Admin TI panel.
    // 4. Seed Equipments
    const eqCount = await prisma.equipment.count();
    if (eqCount === 0) {
      await prisma.equipment.create({
        data: {
          nome: "Projetor / Datashow",
          quantidade: 1,
          ativo: true
        }
      });
      console.log("[Bootstrap] Equipamento padrão 'Projetor / Datashow' criado.");
    }
  } catch (err) {
    console.error("Erro durante o bootstrap do banco de dados:", err);
  }
}

// Launch bootstrap
bootstrap();

/* -------------------------------------------------------------
 * API ROUTING - SECURITY AUTHENTICATION
 * ------------------------------------------------------------- */

// AUTHENTICATION LOGIN (Accepts email & senha)
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: "E-mail ou senha ausentes" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({ error: "Nenhum usuário cadastrado com este e-mail." });
    }

    if (user.senha !== senha) {
      return res.status(401).json({ error: "Sua senha de acesso está incorreta. Tente novamente." });
    }

    const token = "session-" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    sessions.set(token, {
      userId: user.id,
      role: user.role,
      nome: user.nome,
      email: user.email,
      setor: user.setor
    });

    res.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        setor: user.setor,
        setorId: user.setorId,
        avatarUrl: user.avatarUrl
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: "Erro no serviço de login" });
  }
});

// GET Authenticated profile session details
app.get("/api/me", authenticate, (req: any, res) => {
  res.json(req.user);
});

/* -------------------------------------------------------------
 * API ROUTING - USER MANAGEMENT (Admin Protected)
 * ------------------------------------------------------------- */

// GET All Users
app.get("/api/users", authenticate, async (req, res) => {
  try {
    const usersList = await prisma.user.findMany({
      orderBy: { nome: "asc" },
      include: { setorRel: true }
    });
    res.json(usersList);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// CREATE User
app.post("/api/users", requireAdmin, async (req, res) => {
  const { nome, email, senha, role, setorId, avatarUrl } = req.body;
  if (!nome || !email || !senha || !role || !setorId) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes (Nome, E-mail, Senha, Cargo e Setor)." });
  }

  try {
    const duplicate = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (duplicate) {
      return res.status(400).json({ error: "Este endereço de email já está cadastrado por outro usuário!" });
    }

    const sector = await prisma.sector.findUnique({ where: { id: setorId } });
    if (!sector) {
      return res.status(400).json({ error: "O setor selecionado é inválido ou não existe." });
    }

    const newUser = await prisma.user.create({
      data: {
        nome,
        email: email.toLowerCase().trim(),
        senha,
        role,
        setor: sector.nome,
        setorId: sector.id,
        avatarUrl: avatarUrl || "US"
      }
    });
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// UPDATE User
app.put("/api/users/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, role, setorId, avatarUrl } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Usuário não localizado." });
    }

    if (email && email.toLowerCase().trim() !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (duplicate) {
        return res.status(400).json({ error: "Este endereço de email já está sendo utilizado por outro usuário." });
      }
    }

    let sectorName = existing.setor;
    let finalSectorId = existing.setorId;
    if (setorId && setorId !== existing.setorId) {
      const sector = await prisma.sector.findUnique({ where: { id: setorId } });
      if (!sector) {
        return res.status(400).json({ error: "O setor selecionado é inválido ou não existe." });
      }
      sectorName = sector.nome;
      finalSectorId = sector.id;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nome: nome ?? existing.nome,
        email: email ? email.toLowerCase().trim() : existing.email,
        senha: senha ?? existing.senha,
        role: role ?? existing.role,
        setor: sectorName,
        setorId: finalSectorId,
        avatarUrl: avatarUrl ?? existing.avatarUrl
      }
    });

    // Update active in-memory sessions if the edited user has one
    for (const [key, sess] of sessions.entries()) {
      if (sess.userId === id) {
        sessions.set(key, {
          ...sess,
          nome: updatedUser.nome,
          email: updatedUser.email,
          role: updatedUser.role,
          setor: updatedUser.setor
        });
      }
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// DELETE User
app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (id === "user-admin") {
    return res.status(403).json({ error: "Não é permitido excluir o usuário Administrador principal!" });
  }

  try {
    await prisma.user.delete({ where: { id } });
    // Remove session if logged in
    for (const [token, value] of sessions.entries()) {
      if (value.userId === id) {
        sessions.delete(token);
      }
    }
    res.json({ message: "Usuário deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});


/* -------------------------------------------------------------
 * API ROUTING - SECTORS (Admin Secured Writes)
 * ------------------------------------------------------------- */

// GET All Sectors
app.get("/api/sectors", authenticate, async (req, res) => {
  try {
    const list = await prisma.sector.findMany({ orderBy: { nome: "asc" } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar setores" });
  }
});

// CREATE Sector (Admin only)
app.post("/api/sectors", requireAdmin, async (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: "O nome do setor é obrigatório." });
  }
  try {
    const existing = await prisma.sector.findUnique({ where: { nome: nome.trim() } });
    if (existing) {
      return res.status(400).json({ error: "Setor já cadastrado com este nome!" });
    }
    const newSector = await prisma.sector.create({ data: { nome: nome.trim() } });
    res.json(newSector);
  } catch (err) {
    res.status(500).json({ error: "Erro ao cadastrar setor." });
  }
});

// UPDATE Sector (Admin only)
app.put("/api/sectors/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: "O nome do setor é obrigatório." });
  }
  try {
    const existing = await prisma.sector.findUnique({ where: { nome: nome.trim() } });
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: "Já existe outro setor cadastrado com este mesmo nome." });
    }
    const updated = await prisma.sector.update({
      where: { id },
      data: { nome: nome.trim() }
    });
    // Propagate changes to user sectors string
    await prisma.user.updateMany({
      where: { setorId: id },
      data: { setor: nome.trim() }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar setor." });
  }
});

// DELETE Sector (Admin only)
app.delete("/api/sectors/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const userCount = await prisma.user.count({ where: { setorId: id } });
    if (userCount > 0) {
      return res.status(400).json({ error: "Não é permitido excluir o setor, pois existem usuários vinculados a ele." });
    }
    await prisma.sector.delete({ where: { id } });
    res.json({ message: "Setor removido com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir setor." });
  }
});


/* -------------------------------------------------------------
 * API ROUTING - EQUIPMENT CONTROL (Admin Secured Writes)
 * ------------------------------------------------------------- */

// GET All Equipments
app.get("/api/equipments", authenticate, async (req, res) => {
  try {
    const list = await prisma.equipment.findMany({ orderBy: { nome: "asc" } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar equipamentos." });
  }
});

// CREATE Equipment (Admin only)
app.post("/api/equipments", requireAdmin, async (req, res) => {
  const { nome, quantidade, ativo } = req.body;
  if (!nome || typeof quantidade !== "number" || quantidade < 0) {
    return res.status(400).json({ error: "Nome e quantidade do equipamento válidos são necessários." });
  }
  try {
    const existing = await prisma.equipment.findFirst({ where: { nome: { equals: nome.trim() } } });
    if (existing) {
      return res.status(400).json({ error: "Já existe um equipamento cadastrado com este nome!" });
    }
    const newEq = await prisma.equipment.create({
      data: {
        nome: nome.trim(),
        quantidade,
        ativo: ativo ?? true
      }
    });
    res.json(newEq);
  } catch (err) {
    res.status(500).json({ error: "Erro ao cadastrar equipamento." });
  }
});

// UPDATE Equipment (Admin only)
app.put("/api/equipments/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nome, quantidade, ativo } = req.body;

  try {
    const eq = await prisma.equipment.findUnique({ where: { id } });
    if (!eq) {
      return res.status(404).json({ error: "Equipamento não localizado." });
    }

    const data: any = {};
    if (nome) {
      const existing = await prisma.equipment.findFirst({ where: { nome: { equals: nome.trim() }, NOT: { id } } });
      if (existing) {
        return res.status(400).json({ error: "Já existe outro equipamento cadastrado com este nome." });
      }
      data.nome = nome.trim();
    }
    if (typeof quantidade === "number") {
      if (quantidade < 0) return res.status(400).json({ error: "A quantidade deve ser maior ou igual a zero." });
      data.quantidade = quantidade;
    }
    if (typeof ativo === "boolean") {
      data.ativo = ativo;
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar equipamento." });
  }
});

// DELETE Equipment (Admin only)
app.delete("/api/equipments/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.equipment.delete({ where: { id } });
    res.json({ message: "Equipamento removido com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir equipamento." });
  }
});


/* -------------------------------------------------------------
 * API ROUTING - BOOKINGS (Authenticated Protected)
 * ------------------------------------------------------------- */

// GET All Bookings (including auto-finalization check on fly)
app.get("/api/bookings", authenticate, async (req, res) => {
  try {
    await runAutoFinalizer();
    const bookings = await prisma.booking.findMany({
      orderBy: { data: "desc" },
      include: {
        equipmentsRequested: {
          include: {
            equipment: true
          }
        }
      }
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Erro ao sincronizar reservas" });
  }
});

// CREATE Booking with backend overlap & equipment constraints check
app.post("/api/bookings", authenticate, async (req: any, res) => {
  const {
    sala,
    data,
    horaInicial,
    horaFinal,
    responsavel,
    motivo,
    situacao,
    equipamentos, // custom historical text fallback
    tempoDeUso,
    pessoas,
    lembreteAntecedencia,
    lembreteMeio,
    equipamentosSolicitados, // Array of { equipmentId: string, quantidade: number }
    datasRecorrentes // Array of "YYYY-MM-DD"
  } = req.body;

  if (!sala || !data || !horaInicial || !horaFinal || !responsavel || !situacao) {
    return res.status(400).json({ error: "Informações fundamentais do agendamento ausentes." });
  }

  const reqEqs = (equipamentosSolicitados || []) as { equipmentId: string; quantidade: number }[];

  // Handle recurrence creation loop
  if (datasRecorrentes && Array.isArray(datasRecorrentes) && datasRecorrentes.length > 0) {
    const recurrenceId = crypto.randomUUID();
    const criados: string[] = [];
    const conflitos: { data: string; motivo: string }[] = [];

    // Pre-build the equipment text summary
    let equipSummaryText = equipamentos || "Sem material";
    if (reqEqs.length > 0) {
      const summaryParts = [];
      for (const reqEq of reqEqs) {
        if (reqEq.quantidade <= 0) continue;
        const eqItem = await prisma.equipment.findUnique({ where: { id: reqEq.equipmentId } });
        if (eqItem) {
          summaryParts.push(`${eqItem.nome} (${reqEq.quantidade}x)`);
        }
      }
      if (summaryParts.length > 0) {
        equipSummaryText = summaryParts.join(", ");
      }
    }

    const startMin = parseTimeToMinutes(horaInicial);
    const endMin = parseTimeToMinutes(horaFinal);

    for (const d of datasRecorrentes) {
      try {
        if (situacao === "Confirmado") {
          // 1. Room Overlap Check
          const overlappingBookings = await prisma.booking.findMany({
            where: { sala, data: d, situacao: "Confirmado" }
          });

          const conflict = overlappingBookings.find((b) => {
            const otherStart = parseTimeToMinutes(b.horaInicial);
            const otherEnd = parseTimeToMinutes(b.horaFinal);
            return startMin < otherEnd && endMin > otherStart;
          });

          if (conflict) {
            conflitos.push({
              data: d,
              motivo: `Sala "${sala}" ocupada das ${conflict.horaInicial} às ${conflict.horaFinal} por "${conflict.responsavel}".`
            });
            continue;
          }

          // 2. Equipment Conflict check
          const eqConflict = await getEquipmentConflict(undefined, d, horaInicial, horaFinal, reqEqs);
          if (eqConflict) {
            conflitos.push({
              data: d,
              motivo: eqConflict.error
            });
            continue;
          }
        }

        // Create individual booking for date d
        await prisma.$transaction(async (tx) => {
          const b = await tx.booking.create({
            data: {
              sala,
              data: d,
              horaInicial,
              horaFinal,
              responsavel,
              motivo: motivo || "Sem motivo especificado",
              situacao,
              equipamentos: equipSummaryText,
              usuarioId: req.user.userId,
              tempoDeUso: tempoDeUso || "1h",
              pessoas: pessoas || "1",
              lembreteAntecedencia: lembreteAntecedencia || "none",
              lembreteMeio: lembreteMeio || "none",
              recorrenceId: recurrenceId
            }
          });

          if (reqEqs.length > 0) {
            await tx.bookingEquipment.createMany({
              data: reqEqs.map(eq => ({
                bookingId: b.id,
                equipmentId: eq.equipmentId,
                quantidade: eq.quantidade
              }))
            });
          }
        });

        criados.push(d);
      } catch (err: any) {
        conflitos.push({
          data: d,
          motivo: `Erro inesperado: ${err.message || String(err)}`
        });
      }
    }

    return res.json({
      criados,
      conflitos,
      isRecurrent: true
    });
  }

  // Build friendly equipment text summary
  let equipSummaryText = equipamentos || "Sem material";
  if (reqEqs.length > 0) {
    const summaryParts = [];
    for (const reqEq of reqEqs) {
      if (reqEq.quantidade <= 0) continue;
      const eqItem = await prisma.equipment.findUnique({ where: { id: reqEq.equipmentId } });
      if (eqItem) {
        summaryParts.push(`${eqItem.nome} (${reqEq.quantidade}x)`);
      }
    }
    if (summaryParts.length > 0) {
      equipSummaryText = summaryParts.join(", ");
    }
  }

  try {
    if (situacao === "Confirmado") {
      const startMin = parseTimeToMinutes(horaInicial);
      const endMin = parseTimeToMinutes(horaFinal);

      // 1. Room Overlap Check
      const overlappingBookings = await prisma.booking.findMany({
        where: { sala, data, situacao: "Confirmado" }
      });

      const conflict = overlappingBookings.find((b) => {
        const otherStart = parseTimeToMinutes(b.horaInicial);
        const otherEnd = parseTimeToMinutes(b.horaFinal);
        return startMin < otherEnd && endMin > otherStart;
      });

      if (conflict) {
        return res.status(400).json({
          conflict: true,
          error: `⚠️ Conflito de Horário! A sala "${sala}" já está reservada por "${conflict.responsavel}" nesse mesmo período (${conflict.horaInicial} às ${conflict.horaFinal}).`
        });
      }

      // 2. Equipment Conflict check
      const eqConflict = await getEquipmentConflict(undefined, data, horaInicial, horaFinal, reqEqs);
      if (eqConflict) {
        return res.status(400).json({
          equipmentError: true,
          error: eqConflict.error
        });
      }
    }

    // Create the booking record
    const newBooking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          sala,
          data,
          horaInicial,
          horaFinal,
          responsavel,
          motivo: motivo || "Sem motivo especificado",
          situacao,
          equipamentos: equipSummaryText,
          usuarioId: req.user.userId, // auto bound to logged user ID
          tempoDeUso: tempoDeUso || "1h",
          pessoas: pessoas || "1",
          lembreteAntecedencia: lembreteAntecedencia || "none",
          lembreteMeio: lembreteMeio || "none"
        }
      });

      // Write requested equipments linkage
      if (reqEqs.length > 0) {
        await tx.bookingEquipment.createMany({
          data: reqEqs.map(eq => ({
            bookingId: b.id,
            equipmentId: eq.equipmentId,
            quantidade: eq.quantidade
          }))
        });
      }

      return b;
    });

    const fullBooking = await prisma.booking.findUnique({
      where: { id: newBooking.id },
      include: {
        equipmentsRequested: {
          include: {
            equipment: true
          }
        }
      }
    });

    res.json(fullBooking);
  } catch (err) {
    console.error("Erro ao criar reserva no backend:", err);
    res.status(500).json({ error: "Erro ao criar reserva" });
  }
});

// UPDATE Booking
app.put("/api/bookings/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const {
    sala,
    data,
    horaInicial,
    horaFinal,
    responsavel,
    motivo,
    situacao,
    equipamentos,
    tempoDeUso,
    pessoas,
    lembreteAntecedencia,
    lembreteMeio,
    equipamentosSolicitados
  } = req.body;

  const reqEqs = (equipamentosSolicitados || []) as { equipmentId: string; quantidade: number }[];

  try {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    if (situacao === "Confirmado") {
      const startMin = parseTimeToMinutes(horaInicial || existing.horaInicial);
      const endMin = parseTimeToMinutes(horaFinal || existing.horaFinal);
      const targetSala = sala || existing.sala;
      const targetData = data || existing.data;

      // 1. Room Overlap Check
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          sala: targetSala,
          data: targetData,
          situacao: "Confirmado",
          NOT: { id }
        }
      });

      const conflict = overlappingBookings.find((b) => {
        const otherStart = parseTimeToMinutes(b.horaInicial);
        const otherEnd = parseTimeToMinutes(b.horaFinal);
        return startMin < otherEnd && endMin > otherStart;
      });

      if (conflict) {
        return res.status(400).json({
          conflict: true,
          error: `⚠️ Conflito de Horário! A sala "${targetSala}" já está reservada por "${conflict.responsavel}" nesse mesmo período (${conflict.horaInicial} às ${conflict.horaFinal}).`
        });
      }

      // 2. Equipment Conflict check
      const eqConflict = await getEquipmentConflict(id, targetData, horaInicial || existing.horaInicial, horaFinal || existing.horaFinal, reqEqs);
      if (eqConflict) {
        return res.status(400).json({
          equipmentError: true,
          error: eqConflict.error
        });
      }
    }

    // Build friendly equipment text summary
    let equipSummaryText = equipamentos ?? existing.equipamentos;
    if (equipamentosSolicitados) {
      if (reqEqs.length > 0) {
        const summaryParts = [];
        for (const reqEq of reqEqs) {
          if (reqEq.quantidade <= 0) continue;
          const eqItem = await prisma.equipment.findUnique({ where: { id: reqEq.equipmentId } });
          if (eqItem) {
            summaryParts.push(`${eqItem.nome} (${reqEq.quantidade}x)`);
          }
        }
        equipSummaryText = summaryParts.length > 0 ? summaryParts.join(", ") : "Sem material";
      } else {
        equipSummaryText = "Sem material";
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          sala: sala ?? existing.sala,
          data: data ?? existing.data,
          horaInicial: horaInicial ?? existing.horaInicial,
          horaFinal: horaFinal ?? existing.horaFinal,
          responsavel: responsavel ?? existing.responsavel,
          motivo: motivo ?? existing.motivo,
          situacao: situacao ?? existing.situacao,
          equipamentos: equipSummaryText,
          tempoDeUso: tempoDeUso ?? existing.tempoDeUso,
          pessoas: pessoas ?? existing.pessoas,
          lembreteAntecedencia: lembreteAntecedencia ?? existing.lembreteAntecedencia,
          lembreteMeio: lembreteMeio ?? existing.lembreteMeio
        }
      });

      if (equipamentosSolicitados) {
        await tx.bookingEquipment.deleteMany({ where: { bookingId: id } });
        if (reqEqs.length > 0) {
          await tx.bookingEquipment.createMany({
            data: reqEqs.map(eq => ({
              bookingId: id,
              equipmentId: eq.equipmentId,
              quantidade: eq.quantidade
            }))
          });
        }
      }

      return b;
    });

    const fullBookingResult = await prisma.booking.findUnique({
      where: { id: updated.id },
      include: {
        equipmentsRequested: {
          include: {
            equipment: true
          }
        }
      }
    });

    res.json(fullBookingResult);
  } catch (err) {
    console.error("Erro ao atualizar reserva no backend:", err);
    res.status(500).json({ error: "Erro ao atualizar reserva" });
  }
});

// QUICK STATUS UPDATE PATCH with overlap & equipment checks
app.patch("/api/bookings/:id/status", authenticate, async (req, res) => {
  const { id } = req.params;
  const { situacao } = req.body;

  if (!situacao) {
    return res.status(400).json({ error: "Situação ausente" });
  }

  try {
    const existing = await prisma.booking.findUnique({
      where: { id },
      include: {
        equipmentsRequested: true
      }
    });
    if (!existing) {
      return res.status(404).json({ error: "Reserva não cadastrada" });
    }

    if (situacao === "Confirmado") {
      const startMin = parseTimeToMinutes(existing.horaInicial);
      const endMin = parseTimeToMinutes(existing.horaFinal);

      // 1. Room Overlap
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          sala: existing.sala,
          data: existing.data,
          situacao: "Confirmado",
          NOT: { id }
        }
      });

      const conflict = overlappingBookings.find((b) => {
        const otherStart = parseTimeToMinutes(b.horaInicial);
        const otherEnd = parseTimeToMinutes(b.horaFinal);
        return startMin < otherEnd && endMin > otherStart;
      });

      if (conflict) {
        return res.status(400).json({
          conflict: true,
          error: `⚠️ Conflito de Horário! A sala "${existing.sala}" já está reservada por "${conflict.responsavel}" nesse mesmo período (${conflict.horaInicial} às ${conflict.horaFinal}).`
        });
      }

      // 2. Equipments overlap check
      const reqEqs = existing.equipmentsRequested.map(er => ({
        equipmentId: er.equipmentId,
        quantidade: er.quantidade
      }));
      const eqConflict = await getEquipmentConflict(id, existing.data, existing.horaInicial, existing.horaFinal, reqEqs);
      if (eqConflict) {
        return res.status(400).json({
          equipmentError: true,
          error: eqConflict.error
        });
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { situacao },
      include: {
        equipmentsRequested: {
          include: {
            equipment: true
          }
        }
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao alternar status do agendamento" });
  }
});

// DELETE Booking
app.delete("/api/bookings/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id } });
    res.json({ message: "Reserva excluída com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir agendamento" });
  }
});

/* -------------------------------------------------------------
 * API ROUTING - ROOMS (Authenticated & Admin Protected CRUD)
 * ------------------------------------------------------------- */

// GET Active Rooms
app.get("/api/rooms", authenticate, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: "Ativa" },
      orderBy: { name: "asc" }
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar salas ativas" });
  }
});

// GET All Rooms (including inactive, restricted to admins/TI)
app.get("/api/rooms/all", requireAdmin, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" }
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar todas as salas" });
  }
});

// POST Create Room (restricted to admins/TI)
app.post("/api/rooms", requireAdmin, async (req, res) => {
  const { name, capacity, location, description, status, corBg, corTexto } = req.body;
  if (!name || !name.trim() || typeof capacity !== "number" || capacity <= 0 || !location || !location.trim()) {
    return res.status(400).json({ error: "Nome, capacidade (número positivo) e localização da sala são obrigatórios." });
  }

  try {
    const trimmedName = name.trim();
    const existing = await prisma.room.findFirst({
      where: { name: { equals: trimmedName } }
    });
    if (existing) {
      return res.status(400).json({ error: "Já existe uma sala cadastrada com este nome!" });
    }

    // Assign dynamic or default slate/indigo-based colors to match the app theme
    const resolvedCorBg = corBg || "bg-indigo-50 text-indigo-800 border-indigo-200";
    const resolvedCorTexto = corTexto || "#5B5CEB";

    const newRoom = await prisma.room.create({
      data: {
        name: trimmedName,
        nome: trimmedName, // backward compat
        capacity,
        capacidade: capacity, // backward compat
        location: location.trim(),
        description: description ? description.trim() : "",
        status: status || "Ativa",
        corBg: resolvedCorBg,
        corTexto: resolvedCorTexto
      }
    });

    res.json(newRoom);
  } catch (err) {
    console.error("Erro ao criar sala:", err);
    res.status(500).json({ error: "Erro ao criar sala." });
  }
});

// PUT Update Room (restricted to admins/TI)
app.put("/api/rooms/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, capacity, location, description, status, corBg, corTexto } = req.body;

  try {
    const existingRoom = await prisma.room.findUnique({
      where: { id }
    });
    if (!existingRoom) {
      return res.status(404).json({ error: "Sala não encontrada." });
    }

    const updateData: any = {};
    if (name) {
      const trimmedName = name.trim();
      const duplicate = await prisma.room.findFirst({
        where: {
          name: trimmedName,
          NOT: { id }
        }
      });
      if (duplicate) {
        return res.status(400).json({ error: "Já existe outra sala cadastrada com este mesmo nome." });
      }
      updateData.name = trimmedName;
      updateData.nome = trimmedName;
    }

    if (typeof capacity === "number") {
      if (capacity <= 0) {
        return res.status(400).json({ error: "A capacidade deve ser maior que zero." });
      }
      updateData.capacity = capacity;
      updateData.capacidade = capacity;
    }

    if (location !== undefined) {
      updateData.location = location.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (corBg !== undefined) {
      updateData.corBg = corBg;
    }

    if (corTexto !== undefined) {
      updateData.corTexto = corTexto;
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: updateData
    });

    res.json(updatedRoom);
  } catch (err) {
    console.error("Erro ao atualizar sala:", err);
    res.status(500).json({ error: "Erro ao atualizar sala." });
  }
});

// DELETE Room (restricted to admins/TI with future bookings validation)
app.delete("/api/rooms/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const room = await prisma.room.findUnique({
      where: { id }
    });
    if (!room) {
      return res.status(404).json({ error: "Sala não localizada." });
    }

    // Validate that there are no future active bookings
    const todayStr = new Date().toISOString().split("T")[0];
    const activeFutureBookings = await prisma.booking.findMany({
      where: {
        sala: room.name || room.nome || "",
        situacao: "Confirmado",
        data: { gte: todayStr }
      }
    });

    if (activeFutureBookings.length > 0) {
      return res.status(400).json({
        error: `Não é possível excluir esta sala porque ela possui ${activeFutureBookings.length} reservas futuras ativas. Por favor, inative a sala em vez de excluí-la.`
      });
    }

    await prisma.room.delete({
      where: { id }
    });

    res.json({ message: "Sala removida com sucesso." });
  } catch (err) {
    console.error("Erro ao excluir sala:", err);
    res.status(500).json({ error: "Erro ao excluir sala." });
  }
});

/* -------------------------------------------------------------
 * DEVELOPMENT & PRODUCTION ASSETS ROUTING (VITE MIDDLEWARE)
 * ------------------------------------------------------------- */
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: any, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sala-Sync Server] Servidor escutando na porta ${PORT}`);
  });
}

startServer();
