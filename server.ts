import express from "express";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to time parse
function parseTimeToMinutes(tStr: string): number {
  if (!tStr) return 0;
  const parts = tStr.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

// Auto-finalize bookings that are past their end schedules in the database
async function runAutoFinalizer() {
  const now = new Date();
  try {
    const activeBookings = await prisma.booking.findMany({
      where: { situacao: "Confirmado" }
    });
    
    let updatedCount = 0;
    for (const b of activeBookings) {
      const timeStr = b.horaFinal || b.horaInicial;
      if (!b.data || !timeStr) continue;
      
      const [year, month, day] = b.data.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      
      // Compute correct date comparison matching scheduler input local timezone
      const bookingEnd = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      if (now > bookingEnd) {
        await prisma.booking.update({
          where: { id: b.id },
          data: { situacao: "Finalizado" }
        });
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`[Auto-Finalizador] Reserva(s) finalizada(s) automaticamente: ${updatedCount}`);
    }
  } catch (err) {
    console.error("Erro no Auto-Finalizador de reservas:", err);
  }
}

// Periodic check every 15 seconds
setInterval(runAutoFinalizer, 15000);

// Bootstrap database with Admin and template rooms
async function bootstrap() {
  try {
    // 1. Admin
    const adminCount = await prisma.user.count({ where: { email: "admin@sala-sync.com" } });
    if (adminCount === 0) {
      await prisma.user.create({
        data: {
          id: "user-admin",
          nome: "admin",
          email: "admin@sala-sync.com",
          senha: "123456",
          role: "Administrador",
          setor: "TI",
          avatarUrl: "AD"
        }
      });
      console.log("[Bootstrap] Usuário Administrador padrão criado com sucesso.");
    }

    // 2. Rooms
    const roomCount = await prisma.room.count();
    if (roomCount === 0) {
      const defaultRooms = [
        {
          id: "sala-escola",
          nome: "Sala (Escola de Saúde)",
          corBg: "bg-amber-50 text-amber-800 border-amber-200",
          corTexto: "#78350f",
          capacidade: 30,
        },
        {
          id: "sala-reunioes-2",
          nome: "Sala de reuniões 2",
          corBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          corTexto: "#065f46",
          capacidade: 12,
        },
        {
          id: "sala-conselho",
          nome: "Sala do Conselho",
          corBg: "bg-blue-50 text-blue-800 border-blue-200",
          corTexto: "#075985",
          capacidade: 20,
        },
        {
          id: "auditorio",
          nome: "Auditório Principal",
          corBg: "bg-purple-50 text-purple-800 border-purple-200",
          corTexto: "#6b21a8",
          capacidade: 80,
        }
      ];

      for (const room of defaultRooms) {
        await prisma.room.create({ data: room });
      }
      console.log("[Bootstrap] Salas iniciais criadas com sucesso.");
    }
  } catch (err) {
    console.error("Erro durante o bootstrap do banco de dados:", err);
  }
}

// Trigger initial bootstrap
bootstrap();

/* -------------------------------------------------------------
 * API ROUTING - USER MANAGEMENT
 * ------------------------------------------------------------- */

// GET All Users
app.get("/api/users", async (req, res) => {
  try {
    const usersList = await prisma.user.findMany({
      orderBy: { nome: "asc" }
    });
    res.json(usersList);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// CREATE User
app.post("/api/users", async (req, res) => {
  const { nome, email, senha, role, setor, avatarUrl } = req.body;
  if (!nome || !email || !senha || !role || !setor) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  try {
    const duplicate = await prisma.user.findUnique({ where: { email } });
    if (duplicate) {
      return res.status(400).json({ error: "Este endereço de email já está cadastrado por outro usuário!" });
    }

    const newUser = await prisma.user.create({
      data: {
        nome,
        email,
        senha,
        role,
        setor,
        avatarUrl: avatarUrl || "US"
      }
    });
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// UPDATE User
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, role, setor, avatarUrl } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Usuário não localizado" });
    }

    // Check duplicate email (if changing email)
    if (email && email !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email } });
      if (duplicate) {
        return res.status(400).json({ error: "Este endereço de email já está sendo utilizado por outro usuário." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nome: nome ?? existing.nome,
        email: email ?? existing.email,
        senha: senha ?? existing.senha,
        role: role ?? existing.role,
        setor: setor ?? existing.setor,
        avatarUrl: avatarUrl ?? existing.avatarUrl
      }
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// DELETE User
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  if (id === "user-admin") {
    return res.status(403).json({ error: "Não é permitido excluir o usuário Administrador principal!" });
  }

  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: "Usuário deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

// POST Auth Login Validate
app.post("/api/login", async (req, res) => {
  const { userId, senha } = req.body;
  if (!userId || !senha) {
    return res.status(400).json({ error: "Usuário ou senha ausentes" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    if (user.senha !== senha) {
      return res.status(401).json({ error: `Senha inválida para o usuário "${user.nome}".` });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Erro no serviço de autenticação" });
  }
});

/* -------------------------------------------------------------
 * API ROUTING - BOOKINGS
 * ------------------------------------------------------------- */

// GET All Bookings (including auto-finalization check on fly)
app.get("/api/bookings", async (req, res) => {
  try {
    await runAutoFinalizer();
    const bookings = await prisma.booking.findMany({
      orderBy: { data: "desc" }
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Erro ao sincronizar reservas" });
  }
});

// CREATE Booking with backend overlap control
app.post("/api/bookings", async (req, res) => {
  const {
    sala,
    data,
    horaInicial,
    horaFinal,
    responsavel,
    motivo,
    situacao,
    equipamentos,
    usuarioId,
    tempoDeUso,
    pessoas,
    lembreteAntecedencia,
    lembreteMeio
  } = req.body;

  if (!sala || !data || !horaInicial || !horaFinal || !responsavel || !situacao) {
    return res.status(400).json({ error: "Informações fundamentais da reserva ausentes" });
  }

  try {
    if (situacao === "Confirmado") {
      const startMin = parseTimeToMinutes(horaInicial);
      const endMin = parseTimeToMinutes(horaFinal);

      // Overlap detection
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          sala,
          data,
          situacao: "Confirmado"
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
          error: `⚠️ Conflito de Horário! A sala "${sala}" já está agendada neste mesmo período por "${conflict.responsavel}" (${conflict.horaInicial} às ${conflict.horaFinal}).`
        });
      }
    }

    const newBooking = await prisma.booking.create({
      data: {
        sala,
        data,
        horaInicial,
        horaFinal,
        responsavel,
        motivo: motivo || "Sem motivo especificado",
        situacao,
        equipamentos: equipamentos || "Sem material",
        usuarioId,
        tempoDeUso: tempoDeUso || "1h",
        pessoas: pessoas || "1",
        lembreteAntecedencia: lembreteAntecedencia || "none",
        lembreteMeio: lembreteMeio || "none"
      }
    });

    res.json(newBooking);
  } catch (err) {
    console.error("Erro ao criar reserva no backend:", err);
    res.status(500).json({ error: "Erro ao criar reserva" });
  }
});

// UPDATE Booking with backend overlap control
app.put("/api/bookings/:id", async (req, res) => {
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
    usuarioId,
    tempoDeUso,
    pessoas,
    lembreteAntecedencia,
    lembreteMeio
  } = req.body;

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

      // Overlap check, skipping current booking ID
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
          error: `⚠️ Conflito de Horário! A sala "${targetSala}" já está agendada neste mesmo período por "${conflict.responsavel}" (${conflict.horaInicial} às ${conflict.horaFinal}).`
        });
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        sala: sala ?? existing.sala,
        data: data ?? existing.data,
        horaInicial: horaInicial ?? existing.horaInicial,
        horaFinal: horaFinal ?? existing.horaFinal,
        responsavel: responsavel ?? existing.responsavel,
        motivo: motivo ?? existing.motivo,
        situacao: situacao ?? existing.situacao,
        equipamentos: equipamentos ?? existing.equipamentos,
        usuarioId: usuarioId ?? existing.usuarioId,
        tempoDeUso: tempoDeUso ?? existing.tempoDeUso,
        pessoas: pessoas ?? existing.pessoas,
        lembreteAntecedencia: lembreteAntecedencia ?? existing.lembreteAntecedencia,
        lembreteMeio: lembreteMeio ?? existing.lembreteMeio
      }
    });

    res.json(updated);
  } catch (err) {
    console.error("Erro ao atualizar reserva no backend:", err);
    res.status(500).json({ error: "Erro ao atualizar reserva" });
  }
});

// QUICK STATUS UPDATE PATCH with overlap logic
app.patch("/api/bookings/:id/status", async (req, res) => {
  const { id } = req.params;
  const { situacao } = req.body;

  if (!situacao) {
    return res.status(400).json({ error: "Situação ausente" });
  }

  try {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Reserva não cadastrada" });
    }

    if (situacao === "Confirmado") {
      const startMin = parseTimeToMinutes(existing.horaInicial);
      const endMin = parseTimeToMinutes(existing.horaFinal);

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
          error: `⚠️ Conflito de Horário! A sala "${existing.sala}" já está agendada neste mesmo período por "${conflict.responsavel}" (${conflict.horaInicial} às ${conflict.horaFinal}).`
        });
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { situacao }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao alternar status do agendamento" });
  }
});

// DELETE Booking
app.delete("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.booking.delete({ where: { id } });
    res.json({ message: "Reserva excluída com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao excluir agendamento" });
  }
});

/* -------------------------------------------------------------
 * API ROUTING - ROOMS
 * ------------------------------------------------------------- */
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar salas predefinidas" });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sala-Sync Server] Servidor escutando na porta ${PORT}`);
  });
}

startServer();
