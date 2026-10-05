import { useMemo, useState } from "react";

import {
  FaCalendarAlt,
  FaCheck,
  FaCut,
  FaSearch,
  FaTimes,
  FaWallet,
  FaWhatsapp,
} from "react-icons/fa";

import "./AdminAttendances.css";

type BookingStatus =
  | "confirmado"
  | "concluido"
  | "cancelado";

interface Booking {
  id: string;
  cliente: string;
  whatsapp: string;
  servico: string;
  valor: number;
  barbeiro: string;
  data: string;
  horario: string;
  status: BookingStatus;
}

interface AdminAttendancesProps {
  bookings: Booking[];
}

type StatusFilter =
  | "todos"
  | "confirmado"
  | "concluido"
  | "cancelado";

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

const statusLabel = (
  status: BookingStatus
) => {
  if (status === "concluido") {
    return "Concluído";
  }

  if (status === "cancelado") {
    return "Cancelado";
  }

  return "Confirmado";
};

function AdminAttendances({
  bookings,
}: AdminAttendancesProps) {
  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("todos");

  const [barberFilter, setBarberFilter] =
    useState("todos");

  /* =====================================
     ESTATÍSTICAS
  ===================================== */

  const completedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "concluido"
      ),
    [bookings]
  );

  const canceledBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "cancelado"
      ),
    [bookings]
  );

  const confirmedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "confirmado"
      ),
    [bookings]
  );

  const completedRevenue = useMemo(
    () =>
      completedBookings.reduce(
        (total, booking) =>
          total + booking.valor,
        0
      ),
    [completedBookings]
  );

  /* =====================================
     LISTA DE PROFISSIONAIS
  ===================================== */

  const barbers = useMemo(() => {
    return Array.from(
      new Set(
        bookings
          .map(
            (booking) =>
              booking.barbeiro
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [bookings]);

  /* =====================================
     FILTROS
  ===================================== */

  const filteredBookings =
    useMemo(() => {
      const term = search
        .trim()
        .toLowerCase();

      const phoneTerm =
        cleanPhone(term);

      return [...bookings]
        .filter((booking) => {
          if (
            statusFilter !== "todos" &&
            booking.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            barberFilter !== "todos" &&
            booking.barbeiro !==
              barberFilter
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

          const client =
            booking.cliente.toLowerCase();

          const service =
            booking.servico.toLowerCase();

          const barber =
            booking.barbeiro.toLowerCase();

          const phone = cleanPhone(
            booking.whatsapp
          );

          return (
            client.includes(term) ||
            service.includes(term) ||
            barber.includes(term) ||
            (phoneTerm.length > 0 &&
              phone.includes(phoneTerm))
          );
        })
        .sort((a, b) => {
          const first =
            `${a.data} ${a.horario}`;

          const second =
            `${b.data} ${b.horario}`;

          return second.localeCompare(
            first
          );
        });
    }, [
      bookings,
      search,
      statusFilter,
      barberFilter,
    ]);

  return (
    <section className="attendances-page">
      {/* CABEÇALHO */}

      <header className="attendances-heading">
        <div>
          <span>
            HISTÓRICO OPERACIONAL
          </span>

          <h2>
            Cada atendimento,
            <br />
            <i>em um só lugar.</i>
          </h2>
        </div>

        <p>
          Acompanhe os serviços da
          NOBRE, consulte o histórico
          dos clientes e visualize o
          faturamento já realizado.
        </p>
      </header>

      {/* INDICADORES */}

      <section className="attendances-stats">
        <article>
          <div className="attendance-stat-icon">
            <FaCut />
          </div>

          <span>
            TOTAL DE REGISTROS
          </span>

          <strong>
            {bookings.length}
          </strong>

          <small>
            Todos os agendamentos
          </small>
        </article>

        <article>
          <div className="attendance-stat-icon">
            <FaCheck />
          </div>

          <span>
            CONCLUÍDOS
          </span>

          <strong>
            {completedBookings.length}
          </strong>

          <small>
            Serviços finalizados
          </small>
        </article>

        <article>
          <div className="attendance-stat-icon">
            <FaTimes />
          </div>

          <span>
            CANCELADOS
          </span>

          <strong>
            {canceledBookings.length}
          </strong>

          <small>
            Registros cancelados
          </small>
        </article>

        <article className="attendance-stat-dark">
          <div className="attendance-stat-icon">
            <FaWallet />
          </div>

          <span>
            FATURAMENTO REALIZADO
          </span>

          <strong>
            {completedRevenue.toLocaleString(
              "pt-BR",
              {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
              }
            )}
          </strong>

          <small>
            Apenas serviços concluídos
          </small>
        </article>
      </section>

      {/* LISTA */}

      <section className="attendances-content">
        <div className="attendances-list-heading">
          <div>
            <span>
              REGISTROS
            </span>

            <h3>
              Atendimentos
            </h3>

            <small>
              {filteredBookings.length}{" "}
              registro(s) encontrado(s)
            </small>
          </div>

          <label className="attendances-search">
            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar cliente, serviço ou WhatsApp"
              aria-label="Buscar atendimento"
            />
          </label>
        </div>

        {/* FILTROS */}

        <div className="attendances-filters">
          <div className="attendance-status-filters">
            <button
              type="button"
              className={
                statusFilter === "todos"
                  ? "attendance-filter-active"
                  : ""
              }
              onClick={() =>
                setStatusFilter("todos")
              }
            >
              Todos
            </button>

            <button
              type="button"
              className={
                statusFilter ===
                "confirmado"
                  ? "attendance-filter-active"
                  : ""
              }
              onClick={() =>
                setStatusFilter(
                  "confirmado"
                )
              }
            >
              Confirmados
              <span>
                {
                  confirmedBookings.length
                }
              </span>
            </button>

            <button
              type="button"
              className={
                statusFilter ===
                "concluido"
                  ? "attendance-filter-active"
                  : ""
              }
              onClick={() =>
                setStatusFilter(
                  "concluido"
                )
              }
            >
              Concluídos
              <span>
                {
                  completedBookings.length
                }
              </span>
            </button>

            <button
              type="button"
              className={
                statusFilter ===
                "cancelado"
                  ? "attendance-filter-active"
                  : ""
              }
              onClick={() =>
                setStatusFilter(
                  "cancelado"
                )
              }
            >
              Cancelados
              <span>
                {
                  canceledBookings.length
                }
              </span>
            </button>
          </div>

          <label className="attendance-barber-filter">
            <span>
              PROFISSIONAL
            </span>

            <select
              value={barberFilter}
              onChange={(event) =>
                setBarberFilter(
                  event.target.value
                )
              }
            >
              <option value="todos">
                Todos os profissionais
              </option>

              {barbers.map(
                (barber) => (
                  <option
                    key={barber}
                    value={barber}
                  >
                    {barber}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        {/* SEM RESULTADOS */}

        {filteredBookings.length ===
          0 && (
          <div className="attendances-empty">
            <FaCalendarAlt />

            <span>
              NENHUM REGISTRO
            </span>

            <h3>
              Nada encontrado
              <br />
              <i>por aqui.</i>
            </h3>

            <p>
              Altere os filtros ou faça
              uma nova busca para
              localizar um atendimento.
            </p>
          </div>
        )}

        {/* TABELA */}

        {filteredBookings.length >
          0 && (
          <div className="attendances-list">
            <div className="attendances-table-head">
              <span>
                DATA / HORÁRIO
              </span>

              <span>CLIENTE</span>

              <span>SERVIÇO</span>

              <span>
                PROFISSIONAL
              </span>

              <span>VALOR</span>

              <span>STATUS</span>
            </div>

            {filteredBookings.map(
              (booking) => (
                <article
                  key={booking.id}
                  className={`attendance-row attendance-row-${booking.status}`}
                >
                  {/* DATA */}

                  <div className="attendance-date">
                    <span className="attendance-mobile-label">
                      DATA / HORÁRIO
                    </span>

                    <strong>
                      {formatDate(
                        booking.data
                      )}
                    </strong>

                    <small>
                      {booking.horario}
                    </small>
                  </div>

                  {/* CLIENTE */}

                  <div className="attendance-client">
                    <span className="attendance-mobile-label">
                      CLIENTE
                    </span>

                    <strong>
                      {booking.cliente}
                    </strong>

                    <a
                      href={whatsappLink(
                        booking.whatsapp
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaWhatsapp />

                      {
                        booking.whatsapp
                      }
                    </a>
                  </div>

                  {/* SERVIÇO */}

                  <div className="attendance-cell">
                    <span className="attendance-mobile-label">
                      SERVIÇO
                    </span>

                    <strong>
                      {booking.servico}
                    </strong>
                  </div>

                  {/* BARBEIRO */}

                  <div className="attendance-cell">
                    <span className="attendance-mobile-label">
                      PROFISSIONAL
                    </span>

                    <strong>
                      {booking.barbeiro}
                    </strong>
                  </div>

                  {/* VALOR */}

                  <div className="attendance-value">
                    <span className="attendance-mobile-label">
                      VALOR
                    </span>

                    <strong>
                      {booking.valor.toLocaleString(
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

                  {/* STATUS */}

                  <div>
                    <span className="attendance-mobile-label">
                      STATUS
                    </span>

                    <span
                      className={`attendance-status attendance-status-${booking.status}`}
                    >
                      {statusLabel(
                        booking.status
                      )}
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </section>
  );
}

export default AdminAttendances;