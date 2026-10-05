import { useEffect, useMemo, useState } from "react";

import {
  FaCalendarAlt,
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaCut,
  FaSignOutAlt,
  FaTimes,
  FaTrash,
  FaUsers,
  FaWallet,
  FaWhatsapp,
} from "react-icons/fa";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import "./AdminDashboard.css";

import AdminClients from "./AdminClients";
import AdminAttendances from "./AdminAttendances";

/* ========================================
   TIPOS
======================================== */

interface AdminDashboardProps {
  onLogout: () => void;
  onBackToSite: () => void;
}

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

type Filter =
  | "todos"
  | "hoje"
  | "proximos";

type AdminPage =
  | "agenda"
  | "clientes"
  | "atendimentos";

/* ========================================
   FUNÇÕES AUXILIARES
======================================== */

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

const formatDate = (date: string) => {
  if (!date) {
    return "—";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] =
      date.split("-");

    return `${day}/${month}/${year}`;
  }

  return date;
};

const cleanPhone = (phone: string) => {
  return phone.replace(/\D/g, "");
};

const whatsappLink = (phone: string) => {
  const numbers = cleanPhone(phone);

  if (!numbers) {
    return "#";
  }

  const withCountryCode =
    numbers.startsWith("55")
      ? numbers
      : `55${numbers}`;

  return `https://wa.me/${withCountryCode}`;
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

const getMinutesFromTime = (
  time: string
) => {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return 0;
  }

  return hours * 60 + minutes;
};

/* ========================================
   COMPONENTE
======================================== */

function AdminDashboard({
  onLogout,
  onBackToSite,
}: AdminDashboardProps) {
  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("hoje");

  const [
    activePage,
    setActivePage,
  ] = useState<AdminPage>("agenda");

  const [
    barberFilter,
    setBarberFilter,
  ] = useState("todos");

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [
    updatingId,
    setUpdatingId,
  ] = useState<string | null>(null);

  const [
    openStatusId,
    setOpenStatusId,
  ] = useState<string | null>(null);

  const [
    bookingToDelete,
    setBookingToDelete,
  ] = useState<Booking | null>(null);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(new Date());

  const today = getTodayIso();

  /* ========================================
     RELÓGIO
  ======================================== */

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        setCurrentTime(new Date());
      }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* ========================================
     BLOQUEIA SCROLL NO MODAL
  ======================================== */

  useEffect(() => {
    if (bookingToDelete) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [bookingToDelete]);

  /* ========================================
     FIRESTORE EM TEMPO REAL
  ======================================== */

  useEffect(() => {
    const bookingsQuery = query(
      collection(
        db,
        "agendamentos"
      )
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,

      (snapshot) => {
        const data: Booking[] =
          snapshot.docs.map(
            (bookingDocument) => {
              const bookingData =
                bookingDocument.data();

              let status: BookingStatus =
                "confirmado";

              if (
                bookingData.status ===
                "concluido"
              ) {
                status = "concluido";
              }

              if (
                bookingData.status ===
                "cancelado"
              ) {
                status = "cancelado";
              }

              return {
                id: bookingDocument.id,

                cliente:
                  bookingData.cliente ??
                  "",

                whatsapp:
                  bookingData.whatsapp ??
                  "",

                servico:
                  bookingData.servico ??
                  "",

                valor: Number(
                  bookingData.valor ?? 0
                ),

                barbeiro:
                  bookingData.barbeiro ??
                  "",

                data:
                  bookingData.data ??
                  "",

                horario:
                  bookingData.horario ??
                  "",

                status,
              };
            }
          );

        data.sort((a, b) => {
          const first =
            `${a.data} ${a.horario}`;

          const second =
            `${b.data} ${b.horario}`;

          return first.localeCompare(
            second
          );
        });

        setBookings(data);
        setError("");
        setLoading(false);
      },

      (firebaseError) => {
        console.error(
          "Erro ao carregar agendamentos:",
          firebaseError
        );

        setError(
          "Não foi possível carregar os agendamentos."
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  /* ========================================
     AGENDAMENTOS DE HOJE
  ======================================== */

  const todayBookings =
    useMemo(() => {
      return bookings.filter(
        (booking) =>
          booking.data === today &&
          booking.status !==
            "cancelado"
      );
    }, [bookings, today]);

  /* ========================================
     AGENDAMENTOS FUTUROS
  ======================================== */

  const upcomingBookings =
    useMemo(() => {
      return bookings.filter(
        (booking) =>
          booking.data >= today &&
          booking.status !==
            "cancelado"
      );
    }, [bookings, today]);

  /* ========================================
     PREVISÃO DO DIA
  ======================================== */

  const todayRevenue =
    useMemo(() => {
      return todayBookings.reduce(
        (total, booking) =>
          total + booking.valor,
        0
      );
    }, [todayBookings]);

  /* ========================================
     CLIENTES ÚNICOS HOJE
  ======================================== */

  const uniqueClientsToday =
    useMemo(() => {
      const clients =
        todayBookings
          .map((booking) =>
            cleanPhone(
              booking.whatsapp
            )
          )
          .filter(Boolean);

      return new Set(clients).size;
    }, [todayBookings]);

  /* ========================================
     PRÓXIMO HORÁRIO
  ======================================== */

  const nextBooking =
    useMemo(() => {
      const currentMinutes =
        currentTime.getHours() *
          60 +
        currentTime.getMinutes();

      const availableToday =
        todayBookings
          .filter(
            (booking) =>
              booking.status ===
                "confirmado" &&
              getMinutesFromTime(
                booking.horario
              ) >= currentMinutes
          )
          .sort(
            (a, b) =>
              getMinutesFromTime(
                a.horario
              ) -
              getMinutesFromTime(
                b.horario
              )
          );

      if (
        availableToday.length > 0
      ) {
        return availableToday[0];
      }

      const future = bookings
        .filter(
          (booking) =>
            booking.data > today &&
            booking.status ===
              "confirmado"
        )
        .sort((a, b) => {
          const first =
            `${a.data} ${a.horario}`;

          const second =
            `${b.data} ${b.horario}`;

          return first.localeCompare(
            second
          );
        });

      return future[0] ?? null;
    }, [
      bookings,
      todayBookings,
      today,
      currentTime,
    ]);

  /* ========================================
     FILTROS DA AGENDA
  ======================================== */

  const filteredBookings =
    useMemo(() => {
      let result = [...bookings];

      if (filter === "hoje") {
        result = result.filter(
          (booking) =>
            booking.data === today
        );
      }

      if (filter === "proximos") {
        result = result.filter(
          (booking) =>
            booking.data >= today
        );
      }

      if (
        barberFilter !== "todos"
      ) {
        result = result.filter(
          (booking) =>
            booking.barbeiro ===
            barberFilter
        );
      }

      return result;
    }, [
      bookings,
      filter,
      barberFilter,
      today,
    ]);

  /* ========================================
     ALTERAR STATUS
  ======================================== */

  const handleStatusChange =
    async (
      booking: Booking,
      newStatus: BookingStatus
    ) => {
      if (
        booking.status ===
        newStatus
      ) {
        setOpenStatusId(null);
        return;
      }

      try {
        setUpdatingId(booking.id);

        setOpenStatusId(null);

        await updateDoc(
          doc(
            db,
            "agendamentos",
            booking.id
          ),
          {
            status: newStatus,
          }
        );
      } catch (updateError) {
        console.error(
          "Erro ao alterar status:",
          updateError
        );

        window.alert(
          "Não foi possível alterar o status do atendimento."
        );
      } finally {
        setUpdatingId(null);
      }
    };

  /* ========================================
     MODAL DE EXCLUSÃO
  ======================================== */

  const openDeleteModal = (
    booking: Booking
  ) => {
    setOpenStatusId(null);

    setBookingToDelete(booking);
  };

  const handleDelete =
    async () => {
      if (!bookingToDelete) {
        return;
      }

      try {
        setDeletingId(
          bookingToDelete.id
        );

        await deleteDoc(
          doc(
            db,
            "agendamentos",
            bookingToDelete.id
          )
        );

        setBookingToDelete(null);
      } catch (deleteError) {
        console.error(
          "Erro ao excluir agendamento:",
          deleteError
        );

        window.alert(
          "Não foi possível excluir esse agendamento."
        );
      } finally {
        setDeletingId(null);
      }
    };

  /* ========================================
     NAVEGAÇÃO
  ======================================== */

  const openAgenda = () => {
    setActivePage("agenda");
    setFilter("hoje");
    setOpenStatusId(null);
  };

  const openClients = () => {
    setActivePage("clientes");
    setOpenStatusId(null);
  };

  const openAttendances = () => {
    setActivePage("atendimentos");
    setOpenStatusId(null);
  };

  /* ========================================
     JSX
  ======================================== */

  return (
    <div className="dashboard">
      {/* SIDEBAR */}

      <aside className="dashboard-sidebar">
        <div>
          <button
            type="button"
            className="dashboard-brand"
            onClick={onBackToSite}
          >
            <span>NOBRE</span>
            <small>ADMIN</small>
          </button>

          <nav className="dashboard-menu">
            {/* AGENDA */}

            <button
              type="button"
              className={
                activePage === "agenda"
                  ? "dashboard-menu-active"
                  : ""
              }
              onClick={openAgenda}
            >
              <FaCalendarAlt />

              <span>Agenda</span>
            </button>

            {/* CLIENTES */}

            <button
              type="button"
              className={
                activePage ===
                "clientes"
                  ? "dashboard-menu-active"
                  : ""
              }
              onClick={openClients}
            >
              <FaUsers />

              <span>Clientes</span>
            </button>

            {/* ATENDIMENTOS */}

            <button
              type="button"
              className={
                activePage ===
                "atendimentos"
                  ? "dashboard-menu-active"
                  : ""
              }
              onClick={
                openAttendances
              }
            >
              <FaCut />

              <span>
                Atendimentos
              </span>
            </button>
          </nav>
        </div>

        {/* RODAPÉ SIDEBAR */}

        <div className="dashboard-sidebar-bottom">
          <button
            type="button"
            onClick={onBackToSite}
          >
            Voltar ao site

            <FaChevronRight />
          </button>

          <button
            type="button"
            className="dashboard-logout"
            onClick={onLogout}
          >
            <FaSignOutAlt />

            Sair
          </button>
        </div>
      </aside>

      {/* =================================
          CONTEÚDO
      ================================= */}

      <main className="dashboard-main">
        {/* CLIENTES */}

        {activePage ===
        "clientes" ? (
          <AdminClients
            bookings={bookings}
          />
        ) : activePage ===
          "atendimentos" ? (
          /* ATENDIMENTOS */

          <AdminAttendances
            bookings={bookings}
          />
        ) : (
          /* AGENDA */

          <>
            {/* CABEÇALHO */}

            <header className="dashboard-header">
              <div>
                <span className="dashboard-eyebrow">
                  PAINEL ADMINISTRATIVO
                </span>

                <h1>
                  Bom dia,
                  <br />
                  <i>Nobre.</i>
                </h1>
              </div>

              <div className="dashboard-date">
                <span>HOJE</span>

                <strong>
                  {new Intl.DateTimeFormat(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  ).format(
                    currentTime
                  )}
                </strong>
              </div>
            </header>

            {/* CARDS */}

            <section className="dashboard-stats">
              <article className="dashboard-stat">
                <div className="stat-icon">
                  <FaCalendarAlt />
                </div>

                <span>
                  AGENDAMENTOS HOJE
                </span>

                <strong>
                  {
                    todayBookings.length
                  }
                </strong>

                <small>
                  {
                    upcomingBookings.length
                  }{" "}
                  agendamento(s)
                  futuro(s)
                </small>
              </article>

              <article className="dashboard-stat">
                <div className="stat-icon">
                  <FaWallet />
                </div>

                <span>
                  PREVISÃO DE HOJE
                </span>

                <strong>
                  {todayRevenue.toLocaleString(
                    "pt-BR",
                    {
                      style:
                        "currency",
                      currency:
                        "BRL",
                      minimumFractionDigits: 0,
                    }
                  )}
                </strong>

                <small>
                  Serviços não
                  cancelados
                </small>
              </article>

              <article className="dashboard-stat">
                <div className="stat-icon">
                  <FaUsers />
                </div>

                <span>
                  CLIENTES HOJE
                </span>

                <strong>
                  {
                    uniqueClientsToday
                  }
                </strong>

                <small>
                  Clientes com horário
                  reservado
                </small>
              </article>

              <article className="dashboard-stat dashboard-stat-dark">
                <div className="stat-icon">
                  <FaCut />
                </div>

                <span>
                  PRÓXIMO HORÁRIO
                </span>

                <strong className="next-time">
                  {nextBooking
                    ? nextBooking.horario
                    : "Livre"}
                </strong>

                <small>
                  {nextBooking
                    ? `${nextBooking.cliente} • ${nextBooking.barbeiro}`
                    : "Nenhum atendimento pendente"}
                </small>
              </article>
            </section>

            {/* =================================
                AGENDA
            ================================= */}

            <section className="dashboard-agenda">
              <div className="agenda-heading">
                <div>
                  <span>
                    AGENDA
                  </span>

                  <h2>
                    Atendimentos
                  </h2>
                </div>

                <div className="agenda-filters">
                  <button
                    type="button"
                    className={
                      filter ===
                      "hoje"
                        ? "filter-active"
                        : ""
                    }
                    onClick={() =>
                      setFilter(
                        "hoje"
                      )
                    }
                  >
                    Hoje
                  </button>

                  <button
                    type="button"
                    className={
                      filter ===
                      "proximos"
                        ? "filter-active"
                        : ""
                    }
                    onClick={() =>
                      setFilter(
                        "proximos"
                      )
                    }
                  >
                    Próximos
                  </button>

                  <button
                    type="button"
                    className={
                      filter ===
                      "todos"
                        ? "filter-active"
                        : ""
                    }
                    onClick={() =>
                      setFilter(
                        "todos"
                      )
                    }
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* PROFISSIONAL */}

              <div className="barber-filter">
                <span>
                  PROFISSIONAL
                </span>

                <select
                  value={
                    barberFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setBarberFilter(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="todos">
                    Todos os barbeiros
                  </option>

                  <option value="Rafael Nobre">
                    Rafael Nobre
                  </option>

                  <option value="Lucas Martins">
                    Lucas Martins
                  </option>
                </select>
              </div>

              {/* CARREGANDO */}

              {loading && (
                <div className="dashboard-state">
                  Carregando
                  agenda...
                </div>
              )}

              {/* ERRO */}

              {!loading &&
                error && (
                  <div className="dashboard-state dashboard-error">
                    {error}
                  </div>
                )}

              {/* VAZIO */}

              {!loading &&
                !error &&
                filteredBookings.length ===
                  0 && (
                  <div className="dashboard-empty">
                    <span>
                      AGENDA LIVRE
                    </span>

                    <h3>
                      Nenhum
                      atendimento
                      <br />
                      <i>
                        por aqui.
                      </i>
                    </h3>

                    <p>
                      Não existem
                      agendamentos
                      para o filtro
                      selecionado.
                    </p>
                  </div>
                )}

              {/* LISTA */}

              {!loading &&
                !error &&
                filteredBookings.length >
                  0 && (
                  <div className="agenda-list">
                    <div className="agenda-table-head">
                      <span>
                        HORÁRIO
                      </span>

                      <span>
                        CLIENTE
                      </span>

                      <span>
                        SERVIÇO
                      </span>

                      <span>
                        PROFISSIONAL
                      </span>

                      <span>
                        DATA
                      </span>

                      <span>
                        VALOR
                      </span>

                      <span>
                        STATUS
                      </span>

                      <span />
                    </div>

                    {filteredBookings.map(
                      (
                        booking
                      ) => (
                        <article
                          className={`agenda-item agenda-item-${booking.status}`}
                          key={
                            booking.id
                          }
                        >
                          {/* HORÁRIO */}

                          <div className="agenda-time">
                            <strong>
                              {
                                booking.horario
                              }
                            </strong>

                            <span>
                              {statusLabel(
                                booking.status
                              )}
                            </span>
                          </div>

                          {/* CLIENTE */}

                          <div className="agenda-client">
                            <strong>
                              {
                                booking.cliente
                              }
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

                          <div className="agenda-cell">
                            <span className="mobile-cell-label">
                              SERVIÇO
                            </span>

                            <strong>
                              {
                                booking.servico
                              }
                            </strong>
                          </div>

                          {/* PROFISSIONAL */}

                          <div className="agenda-cell">
                            <span className="mobile-cell-label">
                              PROFISSIONAL
                            </span>

                            <strong>
                              {
                                booking.barbeiro
                              }
                            </strong>
                          </div>

                          {/* DATA */}

                          <div className="agenda-cell">
                            <span className="mobile-cell-label">
                              DATA
                            </span>

                            <strong>
                              {formatDate(
                                booking.data
                              )}
                            </strong>
                          </div>

                          {/* VALOR */}

                          <div className="agenda-value">
                            <span className="mobile-cell-label">
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

                          <div className="agenda-status-wrapper">
                            <span className="mobile-cell-label">
                              STATUS
                            </span>

                            <button
                              type="button"
                              className={`agenda-status agenda-status-${booking.status}`}
                              disabled={
                                updatingId ===
                                booking.id
                              }
                              onClick={() =>
                                setOpenStatusId(
                                  openStatusId ===
                                    booking.id
                                    ? null
                                    : booking.id
                                )
                              }
                            >
                              <span>
                                {updatingId ===
                                booking.id
                                  ? "Salvando..."
                                  : statusLabel(
                                      booking.status
                                    )}
                              </span>

                              <FaChevronDown />
                            </button>

                            {openStatusId ===
                              booking.id && (
                              <div className="status-menu">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      booking,
                                      "confirmado"
                                    )
                                  }
                                >
                                  <FaCalendarAlt />

                                  Confirmado
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      booking,
                                      "concluido"
                                    )
                                  }
                                >
                                  <FaCheck />

                                  Concluído
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      booking,
                                      "cancelado"
                                    )
                                  }
                                >
                                  <FaTimes />

                                  Cancelado
                                </button>
                              </div>
                            )}
                          </div>

                          {/* EXCLUIR */}

                          <button
                            type="button"
                            className="agenda-delete"
                            aria-label={`Excluir agendamento de ${booking.cliente}`}
                            disabled={
                              deletingId ===
                              booking.id
                            }
                            onClick={() =>
                              openDeleteModal(
                                booking
                              )
                            }
                          >
                            <FaTrash />
                          </button>
                        </article>
                      )
                    )}
                  </div>
                )}
            </section>
          </>
        )}
      </main>

      {/* =================================
          MODAL DE EXCLUSÃO
      ================================= */}

      {bookingToDelete && (
        <div
          className="delete-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setBookingToDelete(
                null
              );
            }
          }}
        >
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            {/* FECHAR */}

            <button
              type="button"
              className="delete-modal-close"
              onClick={() =>
                setBookingToDelete(
                  null
                )
              }
              aria-label="Fechar"
              disabled={
                deletingId !== null
              }
            >
              <FaTimes />
            </button>

            <span className="delete-modal-eyebrow">
              AÇÃO PERMANENTE
            </span>

            <div className="delete-modal-icon">
              <FaTrash />
            </div>

            <h2 id="delete-modal-title">
              Excluir
              <br />
              <i>
                agendamento?
              </i>
            </h2>

            <p className="delete-modal-description">
              Esta ação remove o
              agendamento
              definitivamente e
              libera o horário para
              uma nova reserva.
            </p>

            {/* DADOS */}

            <div className="delete-modal-booking">
              <div>
                <span>
                  CLIENTE
                </span>

                <strong>
                  {
                    bookingToDelete.cliente
                  }
                </strong>
              </div>

              <div>
                <span>
                  DATA E HORÁRIO
                </span>

                <strong>
                  {formatDate(
                    bookingToDelete.data
                  )}
                  {" • "}
                  {
                    bookingToDelete.horario
                  }
                </strong>
              </div>

              <div>
                <span>
                  SERVIÇO
                </span>

                <strong>
                  {
                    bookingToDelete.servico
                  }
                </strong>
              </div>

              <div>
                <span>
                  PROFISSIONAL
                </span>

                <strong>
                  {
                    bookingToDelete.barbeiro
                  }
                </strong>
              </div>
            </div>

            {/* AÇÕES */}

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-cancel"
                onClick={() =>
                  setBookingToDelete(
                    null
                  )
                }
                disabled={
                  deletingId !== null
                }
              >
                Voltar
              </button>

              <button
                type="button"
                className="delete-modal-confirm"
                onClick={
                  handleDelete
                }
                disabled={
                  deletingId !== null
                }
              >
                <FaTrash />

                {deletingId
                  ? "Excluindo..."
                  : "Excluir agendamento"}
              </button>
            </div>

            <span className="delete-modal-warning">
              Essa ação não poderá
              ser desfeita.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;