import { useMemo, useState } from "react";

import {
  FaCalendarAlt,
  FaCheck,
  FaSearch,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa";

import "./AdminClients.css";

interface Booking {
  id: string;
  cliente: string;
  whatsapp: string;
  servico: string;
  valor: number;
  barbeiro: string;
  data: string;
  horario: string;
  status: "confirmado" | "concluido" | "cancelado";
}

interface AdminClientsProps {
  bookings: Booking[];
}

interface Client {
  id: string;
  nome: string;
  whatsapp: string;
  totalAgendamentos: number;
  concluidos: number;
  totalGasto: number;
  ultimaVisita: string | null;
  proximoHorario: string | null;
}

const cleanPhone = (phone: string) => {
  return phone.replace(/\D/g, "");
};

const whatsappLink = (phone: string) => {
  const numbers = cleanPhone(phone);

  if (!numbers) {
    return "#";
  }

  const finalNumber = numbers.startsWith("55")
    ? numbers
    : `55${numbers}`;

  return `https://wa.me/${finalNumber}`;
};

const formatDate = (date: string) => {
  if (!date) {
    return "—";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  return date;
};

const getTodayIso = () => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function AdminClients({
  bookings,
}: AdminClientsProps) {
  const [search, setSearch] = useState("");

  const today = getTodayIso();

  /* ===============================
     CRIA BASE DE CLIENTES
  =============================== */

  const clients = useMemo(() => {
    const clientsMap =
      new Map<string, Client>();

    bookings.forEach((booking) => {
      const phone = cleanPhone(
        booking.whatsapp
      );

      if (!phone) {
        return;
      }

      const currentClient =
        clientsMap.get(phone);

      const isCompleted =
        booking.status === "concluido";

      const isPastOrToday =
        booking.data <= today;

      const isUpcoming =
        booking.data >= today &&
        booking.status === "confirmado";

      if (!currentClient) {
        clientsMap.set(phone, {
          id: phone,

          nome:
            booking.cliente ||
            "Cliente",

          whatsapp:
            booking.whatsapp,

          totalAgendamentos: 1,

          concluidos:
            isCompleted ? 1 : 0,

          totalGasto:
            isCompleted
              ? booking.valor
              : 0,

          ultimaVisita:
            isPastOrToday &&
            booking.status !==
              "cancelado"
              ? booking.data
              : null,

          proximoHorario:
            isUpcoming
              ? `${booking.data}|${booking.horario}`
              : null,
        });

        return;
      }

      currentClient.totalAgendamentos += 1;

      /*
       * Mantém o nome mais recente caso
       * o cliente tenha digitado diferente
       * em outro agendamento.
       */
      if (booking.cliente) {
        currentClient.nome =
          booking.cliente;
      }

      if (isCompleted) {
        currentClient.concluidos += 1;

        currentClient.totalGasto +=
          booking.valor;
      }

      if (
        isPastOrToday &&
        booking.status !== "cancelado" &&
        (!currentClient.ultimaVisita ||
          booking.data >
            currentClient.ultimaVisita)
      ) {
        currentClient.ultimaVisita =
          booking.data;
      }

      if (isUpcoming) {
        const newDateTime =
          `${booking.data}|${booking.horario}`;

        if (
          !currentClient.proximoHorario ||
          newDateTime <
            currentClient.proximoHorario
        ) {
          currentClient.proximoHorario =
            newDateTime;
        }
      }
    });

    return Array.from(
      clientsMap.values()
    ).sort((a, b) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR"
      )
    );
  }, [bookings, today]);

  /* ===============================
     BUSCA
  =============================== */

  const filteredClients =
    useMemo(() => {
      const term = search
        .trim()
        .toLowerCase();

      if (!term) {
        return clients;
      }

      const phoneTerm =
        cleanPhone(term);

      return clients.filter(
        (client) => {
          const name =
            client.nome.toLowerCase();

          const phone =
            cleanPhone(
              client.whatsapp
            );

          return (
            name.includes(term) ||
            (phoneTerm.length > 0 &&
              phone.includes(
                phoneTerm
              ))
          );
        }
      );
    }, [clients, search]);

  /* ===============================
     ESTATÍSTICAS
  =============================== */

  const totalSpent =
    useMemo(() => {
      return clients.reduce(
        (total, client) =>
          total +
          client.totalGasto,
        0
      );
    }, [clients]);

  const returningClients =
    useMemo(() => {
      return clients.filter(
        (client) =>
          client.totalAgendamentos >
          1
      ).length;
    }, [clients]);

  const completedServices =
    useMemo(() => {
      return clients.reduce(
        (total, client) =>
          total +
          client.concluidos,
        0
      );
    }, [clients]);

  return (
    <section className="clients-page">
      {/* CABEÇALHO */}

      <header className="clients-page-heading">
        <div>
          <span>
            BASE DE RELACIONAMENTO
          </span>

          <h2>
            Quem já passou
            <br />
            <i>
              pela nossa cadeira.
            </i>
          </h2>
        </div>

        <p>
          Histórico de clientes
          criado automaticamente a
          partir dos agendamentos da
          NOBRE.
        </p>
      </header>

      {/* ESTATÍSTICAS */}

      <section className="clients-stats">
        <article>
          <div className="clients-stat-icon">
            <FaUser />
          </div>

          <span>
            CLIENTES CADASTRADOS
          </span>

          <strong>
            {clients.length}
          </strong>

          <small>
            Clientes únicos
          </small>
        </article>

        <article>
          <div className="clients-stat-icon">
            <FaCalendarAlt />
          </div>

          <span>
            CLIENTES RECORRENTES
          </span>

          <strong>
            {returningClients}
          </strong>

          <small>
            Mais de um agendamento
          </small>
        </article>

        <article>
          <div className="clients-stat-icon">
            <FaCheck />
          </div>

          <span>
            ATENDIMENTOS CONCLUÍDOS
          </span>

          <strong>
            {completedServices}
          </strong>

          <small>
            Histórico finalizado
          </small>
        </article>

        <article className="clients-stat-dark">
          <span>
            RECEITA CONCLUÍDA
          </span>

          <strong>
            {totalSpent.toLocaleString(
              "pt-BR",
              {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
              }
            )}
          </strong>

          <small>
            Serviços concluídos
          </small>
        </article>
      </section>

      {/* LISTA */}

      <section className="clients-content">
        <div className="clients-list-heading">
          <div>
            <span>
              BASE DE CLIENTES
            </span>

            <h3>Clientes</h3>
          </div>

          {/* BUSCA */}

          <label className="clients-search">
            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar nome ou WhatsApp"
              aria-label="Buscar cliente"
            />
          </label>
        </div>

        {/* SEM CLIENTES */}

        {clients.length === 0 && (
          <div className="clients-empty">
            <FaUser />

            <span>
              NENHUM CLIENTE
            </span>

            <h3>
              Sua base ainda está
              <br />
              <i>começando.</i>
            </h3>

            <p>
              Quando um cliente fizer
              um agendamento, ele
              aparecerá
              automaticamente aqui.
            </p>
          </div>
        )}

        {/* BUSCA SEM RESULTADO */}

        {clients.length > 0 &&
          filteredClients.length ===
            0 && (
            <div className="clients-empty">
              <FaSearch />

              <span>
                NENHUM RESULTADO
              </span>

              <h3>
                Cliente não
                <br />
                <i>encontrado.</i>
              </h3>

              <p>
                Tente pesquisar por
                outro nome ou número
                de WhatsApp.
              </p>
            </div>
          )}

        {/* TABELA */}

        {filteredClients.length >
          0 && (
          <div className="clients-list">
            <div className="clients-table-head">
              <span>CLIENTE</span>

              <span>CONTATO</span>

              <span>
                AGENDAMENTOS
              </span>

              <span>
                CONCLUÍDOS
              </span>

              <span>
                ÚLTIMA VISITA
              </span>

              <span>
                PRÓXIMO HORÁRIO
              </span>

              <span>
                TOTAL GASTO
              </span>
            </div>

            {filteredClients.map(
              (client) => {
                const nextBooking =
                  client.proximoHorario
                    ?.split("|");

                const initial =
                  client.nome
                    .trim()
                    .charAt(0)
                    .toUpperCase() ||
                  "C";

                return (
                  <article
                    className="client-row"
                    key={client.id}
                  >
                    {/* NOME */}

                    <div className="client-name">
                      <div className="client-avatar">
                        {initial}
                      </div>

                      <div>
                        <strong>
                          {client.nome}
                        </strong>

                        <span>
                          {client.totalAgendamentos >
                          1
                            ? "Cliente recorrente"
                            : "Novo cliente"}
                        </span>
                      </div>
                    </div>

                    {/* WHATSAPP */}

                    <div className="client-contact">
                      <span className="client-mobile-label">
                        CONTATO
                      </span>

                      <a
                        href={whatsappLink(
                          client.whatsapp
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FaWhatsapp />

                        {
                          client.whatsapp
                        }
                      </a>
                    </div>

                    {/* AGENDAMENTOS */}

                    <div className="client-data">
                      <span className="client-mobile-label">
                        AGENDAMENTOS
                      </span>

                      <strong>
                        {
                          client.totalAgendamentos
                        }
                      </strong>
                    </div>

                    {/* CONCLUÍDOS */}

                    <div className="client-data">
                      <span className="client-mobile-label">
                        CONCLUÍDOS
                      </span>

                      <strong>
                        {
                          client.concluidos
                        }
                      </strong>
                    </div>

                    {/* ÚLTIMA VISITA */}

                    <div className="client-data">
                      <span className="client-mobile-label">
                        ÚLTIMA VISITA
                      </span>

                      <strong>
                        {client.ultimaVisita
                          ? formatDate(
                              client.ultimaVisita
                            )
                          : "—"}
                      </strong>
                    </div>

                    {/* PRÓXIMO HORÁRIO */}

                    <div className="client-data">
                      <span className="client-mobile-label">
                        PRÓXIMO HORÁRIO
                      </span>

                      <strong>
                        {nextBooking
                          ? `${formatDate(
                              nextBooking[0]
                            )} • ${
                              nextBooking[1]
                            }`
                          : "—"}
                      </strong>
                    </div>

                    {/* TOTAL */}

                    <div className="client-total">
                      <span className="client-mobile-label">
                        TOTAL GASTO
                      </span>

                      <strong>
                        {client.totalGasto.toLocaleString(
                          "pt-BR",
                          {
                            style:
                              "currency",
                            currency:
                              "BRL",
                          }
                        )}
                      </strong>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </section>
  );
}

export default AdminClients;