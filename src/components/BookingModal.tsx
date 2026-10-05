import { useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import "./BookingModal.css";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Service {
  name: string;
  duration: string;
  price: number;
}

interface Barber {
  name: string;
  specialty: string;
}

interface BookingDate {
  week: string;
  day: string;
  month: string;
  monthFull: string;
  year: number;
  iso: string;
  label: string;
}

const services: Service[] = [
  {
    name: "Corte",
    duration: "45 min",
    price: 40,
  },
  {
    name: "Barba",
    duration: "30 min",
    price: 30,
  },
  {
    name: "Corte + Barba",
    duration: "1h",
    price: 65,
  },
  {
    name: "Acabamento",
    duration: "20 min",
    price: 15,
  },
];

const barbers: Barber[] = [
  {
    name: "Rafael Nobre",
    specialty: "Cortes clássicos e modernos",
  },
  {
    name: "Lucas Martins",
    specialty: "Degradê e barba",
  },
];

const times = [
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "13:30",
  "14:15",
  "15:00",
  "15:45",
  "16:30",
  "17:15",
];

const weekNames = [
  "DOM",
  "SEG",
  "TER",
  "QUA",
  "QUI",
  "SEX",
  "SÁB",
];

const monthNames = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

const monthFullNames = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

const padNumber = (value: number) =>
  String(value).padStart(2, "0");

const createIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
};

const createBookingDates = (): BookingDate[] => {
  const availableDates: BookingDate[] = [];

  const currentDate = new Date();

  currentDate.setHours(0, 0, 0, 0);

  let daysAhead = 0;

  /*
    Mostra os próximos 6 dias de atendimento.
    Domingo não entra na agenda.
  */
  while (
    availableDates.length < 6 &&
    daysAhead < 20
  ) {
    const date = new Date(currentDate);

    date.setDate(currentDate.getDate() + daysAhead);

    const weekDay = date.getDay();

    if (weekDay !== 0) {
      const day = padNumber(date.getDate());
      const monthIndex = date.getMonth();
      const year = date.getFullYear();

      availableDates.push({
        week: weekNames[weekDay],
        day,
        month: monthNames[monthIndex],
        monthFull: monthFullNames[monthIndex],
        year,
        iso: createIsoDate(date),
        label: `${day} ${monthNames[monthIndex]}`,
      });
    }

    daysAhead++;
  }

  return availableDates;
};

const createSlotId = (
  barber: string,
  date: string,
  time: string
) => {
  const normalizedBarber = barber
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const normalizedTime = time.replace(":", "-");

  return `${normalizedBarber}_${date}_${normalizedTime}`;
};

function BookingModal({
  isOpen,
  onClose,
}: BookingModalProps) {
  const [step, setStep] = useState(1);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [selectedBarber, setSelectedBarber] =
    useState<Barber | null>(null);

  const [selectedDate, setSelectedDate] =
    useState<BookingDate | null>(null);

  const [selectedTime, setSelectedTime] =
    useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [finished, setFinished] = useState(false);

  const [saving, setSaving] = useState(false);

  const [bookingError, setBookingError] =
    useState("");

  const dates = useMemo(
    () => createBookingDates(),
    [isOpen]
  );

  if (!isOpen) {
    return null;
  }

  const nextStep = () => {
    if (step < 5) {
      setBookingError("");
      setStep(step + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setBookingError("");
      setStep(step - 1);
    }
  };

  const canContinue = () => {
    if (step === 1) {
      return selectedService !== null;
    }

    if (step === 2) {
      return selectedBarber !== null;
    }

    if (step === 3) {
      return selectedDate !== null;
    }

    if (step === 4) {
      return selectedTime !== "";
    }

    return true;
  };

  const formatPhone = (value: string) => {
    const numbers = value
      .replace(/\D/g, "")
      .slice(0, 11);

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(
        2
      )}`;
    }

    return `(${numbers.slice(
      0,
      2
    )}) ${numbers.slice(2, 7)}-${numbers.slice(
      7
    )}`;
  };

  const selectBarber = (barber: Barber) => {
    setSelectedBarber(barber);

    /*
      Se trocar de barbeiro, limpamos o horário
      anteriormente escolhido.
    */
    setSelectedTime("");
    setBookingError("");
  };

  const selectDate = (date: BookingDate) => {
    setSelectedDate(date);

    /*
      Se trocar a data, o horário anterior
      não deve continuar selecionado.
    */
    setSelectedTime("");
    setBookingError("");
  };

  const confirmBooking = async () => {
    setBookingError("");

    const phoneNumbers = phone.replace(/\D/g, "");

    if (
      !name.trim() ||
      phoneNumbers.length < 10 ||
      !selectedService ||
      !selectedBarber ||
      !selectedDate ||
      !selectedTime
    ) {
      setBookingError(
        "Confira os dados antes de confirmar o agendamento."
      );

      return;
    }

    const slotId = createSlotId(
      selectedBarber.name,
      selectedDate.iso,
      selectedTime
    );

    try {
      setSaving(true);

      const bookingReference = doc(
        db,
        "agendamentos",
        slotId
      );

      await setDoc(bookingReference, {
        cliente: name.trim(),
        whatsapp: phone,
        servico: selectedService.name,
        valor: selectedService.price,
        barbeiro: selectedBarber.name,
        data: selectedDate.iso,
        horario: selectedTime,
        status: "confirmado",
        criadoEm: serverTimestamp(),
      });

      setFinished(true);
    } catch (error) {
      console.error(
        "Erro ao salvar agendamento:",
        error
      );

      const firebaseError = error as {
        code?: string;
      };

      if (
        firebaseError.code ===
        "permission-denied"
      ) {
        setSelectedTime("");

        setBookingError(
          "Esse horário já foi reservado. Volte e escolha outro horário."
        );

        return;
      }

      setBookingError(
        "Não foi possível confirmar seu agendamento. Tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);

    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime("");

    setName("");
    setPhone("");

    setFinished(false);
    setSaving(false);
    setBookingError("");

    onClose();
  };

  const progress = finished
    ? 100
    : step * 20;

  const calendarTitle =
    selectedDate ??
    dates[0] ??
    null;

  return (
    <div className="booking-modal">
      <div className="booking-topbar">
        <button
          type="button"
          className="booking-brand"
          onClick={resetAndClose}
        >
          <span>NOBRE</span>
          <small>BARBER CLUB</small>
        </button>

        <div className="booking-topbar-title">
          AGENDAMENTO
        </div>

        <button
          type="button"
          className="booking-close"
          onClick={resetAndClose}
          aria-label="Fechar agendamento"
        >
          <FaTimes />
        </button>
      </div>

      <div className="booking-progress">
        <div
          className="booking-progress-value"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {!finished ? (
        <div className="booking-layout">
          <aside className="booking-sidebar">
            <p className="sidebar-label">
              SEU AGENDAMENTO
            </p>

            <div
              className={`sidebar-step ${
                step >= 1
                  ? "sidebar-step-active"
                  : ""
              }`}
            >
              <span>01</span>

              <div>
                <small>SERVIÇO</small>

                <p>
                  {selectedService?.name ||
                    "Escolha o serviço"}
                </p>
              </div>
            </div>

            <div
              className={`sidebar-step ${
                step >= 2
                  ? "sidebar-step-active"
                  : ""
              }`}
            >
              <span>02</span>

              <div>
                <small>PROFISSIONAL</small>

                <p>
                  {selectedBarber?.name ||
                    "Escolha o profissional"}
                </p>
              </div>
            </div>

            <div
              className={`sidebar-step ${
                step >= 3
                  ? "sidebar-step-active"
                  : ""
              }`}
            >
              <span>03</span>

              <div>
                <small>DATA</small>

                <p>
                  {selectedDate?.label ||
                    "Escolha a data"}
                </p>
              </div>
            </div>

            <div
              className={`sidebar-step ${
                step >= 4
                  ? "sidebar-step-active"
                  : ""
              }`}
            >
              <span>04</span>

              <div>
                <small>HORÁRIO</small>

                <p>
                  {selectedTime ||
                    "Escolha o horário"}
                </p>
              </div>
            </div>

            <div
              className={`sidebar-step ${
                step >= 5
                  ? "sidebar-step-active"
                  : ""
              }`}
            >
              <span>05</span>

              <div>
                <small>SEUS DADOS</small>
                <p>Finalizar reserva</p>
              </div>
            </div>

            {selectedService && (
              <div className="booking-summary-price">
                <span>VALOR</span>

                <strong>
                  R$ {selectedService.price},00
                </strong>
              </div>
            )}
          </aside>

          <div className="booking-main">
            {/* PASSO 1 */}
            {step === 1 && (
              <div className="booking-step-content">
                <span className="step-eyebrow">
                  PASSO 01 DE 05
                </span>

                <h2>
                  O que vamos
                  <br />
                  fazer <i>hoje?</i>
                </h2>

                <p className="step-description">
                  Escolha o serviço que você deseja
                  reservar.
                </p>

                <div className="booking-services">
                  {services.map((service) => (
                    <button
                      type="button"
                      key={service.name}
                      className={`booking-service-option ${
                        selectedService?.name ===
                        service.name
                          ? "option-selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedService(
                          service
                        );

                        setBookingError("");
                      }}
                    >
                      <div>
                        <h3>
                          {service.name}
                        </h3>

                        <span>
                          {service.duration}
                        </span>
                      </div>

                      <strong>
                        R$ {service.price},00
                      </strong>

                      <span className="option-check">
                        <FaCheck />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PASSO 2 */}
            {step === 2 && (
              <div className="booking-step-content">
                <span className="step-eyebrow">
                  PASSO 02 DE 05
                </span>

                <h2>
                  Escolha quem
                  <br />
                  cuida do seu{" "}
                  <i>estilo.</i>
                </h2>

                <p className="step-description">
                  Selecione o profissional para o
                  seu atendimento.
                </p>

                <div className="barber-options">
                  {barbers.map(
                    (barber, index) => (
                      <button
                        type="button"
                        key={barber.name}
                        className={`barber-option ${
                          selectedBarber?.name ===
                          barber.name
                            ? "option-selected"
                            : ""
                        }`}
                        onClick={() =>
                          selectBarber(
                            barber
                          )
                        }
                      >
                        <div
                          className={`booking-barber-photo booking-barber-${
                            index + 1
                          }`}
                        />

                        <div className="booking-barber-details">
                          <span>
                            BARBEIRO
                          </span>

                          <h3>
                            {barber.name}
                          </h3>

                          <p>
                            {
                              barber.specialty
                            }
                          </p>
                        </div>

                        <span className="option-check">
                          <FaCheck />
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* PASSO 3 */}
            {step === 3 && (
              <div className="booking-step-content">
                <span className="step-eyebrow">
                  PASSO 03 DE 05
                </span>

                <h2>
                  Qual o melhor
                  <br />
                  <i>dia?</i>
                </h2>

                <p className="step-description">
                  Escolha uma data disponível para
                  o atendimento.
                </p>

                {calendarTitle && (
                  <div className="date-month">
                    {calendarTitle.monthFull}{" "}
                    <span>
                      {calendarTitle.year}
                    </span>
                  </div>
                )}

                <div className="date-options">
                  {dates.map((date) => (
                    <button
                      type="button"
                      key={date.iso}
                      className={`date-option ${
                        selectedDate?.iso ===
                        date.iso
                          ? "date-selected"
                          : ""
                      }`}
                      onClick={() =>
                        selectDate(date)
                      }
                    >
                      <span>
                        {date.week}
                      </span>

                      <strong>
                        {date.day}
                      </strong>

                      <small>
                        {date.month}
                      </small>
                    </button>
                  ))}
                </div>

                <p className="availability-note">
                  A agenda mostra os próximos dias
                  de atendimento disponíveis.
                </p>
              </div>
            )}

            {/* PASSO 4 */}
            {step === 4 && (
              <div className="booking-step-content">
                <span className="step-eyebrow">
                  PASSO 04 DE 05
                </span>

                <h2>
                  Escolha seu
                  <br />
                  <i>horário.</i>
                </h2>

                <p className="step-description">
                  Horários para{" "}
                  <strong>
                    {selectedDate?.label}
                  </strong>
                  .
                </p>

                <div className="time-options">
                  {times.map((time) => (
                    <button
                      type="button"
                      key={time}
                      className={`time-option ${
                        selectedTime === time
                          ? "time-selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedTime(
                          time
                        );

                        setBookingError("");
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                <p className="availability-note">
                  A disponibilidade será
                  confirmada ao finalizar a
                  reserva.
                </p>
              </div>
            )}

            {/* PASSO 5 */}
            {step === 5 && (
              <div className="booking-step-content">
                <span className="step-eyebrow">
                  ÚLTIMO PASSO
                </span>

                <h2>
                  Falta só
                  <br />
                  <i>confirmar.</i>
                </h2>

                <p className="step-description">
                  Informe seus dados para concluir
                  o agendamento.
                </p>

                <div className="customer-form">
                  <label>
                    <span>SEU NOME</span>

                    <input
                      type="text"
                      placeholder="Como podemos te chamar?"
                      value={name}
                      maxLength={80}
                      autoComplete="name"
                      onChange={(event) => {
                        setName(
                          event.target.value
                        );

                        setBookingError("");
                      }}
                    />
                  </label>

                  <label>
                    <span>WHATSAPP</span>

                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      autoComplete="tel"
                      inputMode="tel"
                      onChange={(event) => {
                        setPhone(
                          formatPhone(
                            event.target
                              .value
                          )
                        );

                        setBookingError("");
                      }}
                    />
                  </label>
                </div>

                <div className="final-summary">
                  <div>
                    <span>SERVIÇO</span>

                    <p>
                      {
                        selectedService?.name
                      }
                    </p>
                  </div>

                  <div>
                    <span>
                      PROFISSIONAL
                    </span>

                    <p>
                      {
                        selectedBarber?.name
                      }
                    </p>
                  </div>

                  <div>
                    <span>
                      DATA / HORÁRIO
                    </span>

                    <p>
                      {selectedDate?.label} •{" "}
                      {selectedTime}
                    </p>
                  </div>

                  <div>
                    <span>TOTAL</span>

                    <strong>
                      R${" "}
                      {
                        selectedService?.price
                      }
                      ,00
                    </strong>
                  </div>
                </div>

                {bookingError && (
                  <p className="booking-error">
                    {bookingError}
                  </p>
                )}
              </div>
            )}

            {/* NAVEGAÇÃO */}
            <div className="booking-navigation">
              {step > 1 ? (
                <button
                  type="button"
                  className="booking-back"
                  onClick={previousStep}
                  disabled={saving}
                >
                  <FaArrowLeft />
                  Voltar
                </button>
              ) : (
                <span />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  className="booking-next"
                  disabled={
                    !canContinue()
                  }
                  onClick={nextStep}
                >
                  Continuar
                  <FaArrowRight />
                </button>
              ) : (
                <button
                  type="button"
                  className="booking-next"
                  disabled={
                    saving ||
                    !name.trim() ||
                    phone.replace(
                      /\D/g,
                      ""
                    ).length < 10
                  }
                  onClick={
                    confirmBooking
                  }
                >
                  {saving
                    ? "Confirmando..."
                    : "Confirmar agendamento"}

                  {!saving && (
                    <FaArrowRight />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="booking-success">
          <div className="success-check">
            <FaCheck />
          </div>

          <span>
            AGENDAMENTO CONFIRMADO
          </span>

          <h2>
            Tudo certo,
            <br />
            <i>
              {name.split(" ")[0]}.
            </i>
          </h2>

          <p>
            Sua cadeira está reservada.
            Confira os detalhes do
            atendimento:
          </p>

          <div className="success-details">
            <div>
              <span>SERVIÇO</span>

              <strong>
                {selectedService?.name}
              </strong>
            </div>

            <div>
              <span>
                PROFISSIONAL
              </span>

              <strong>
                {selectedBarber?.name}
              </strong>
            </div>

            <div>
              <span>DATA</span>

              <strong>
                {selectedDate?.label}
              </strong>
            </div>

            <div>
              <span>HORÁRIO</span>

              <strong>
                {selectedTime}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="success-button"
            onClick={resetAndClose}
          >
            Voltar para o site
          </button>
        </div>
      )}
    </div>
  );
}

export default BookingModal;