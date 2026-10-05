import { useEffect, useState } from "react";

import {

  FaArrowRight,

  FaBars,

  FaInstagram,

  FaTimes,

  FaWhatsapp,

} from "react-icons/fa";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import "./App.css";

import { auth, db } from "./firebase";

import BookingModal from "./components/BookingModal";

import AdminLogin from "./components/AdminLogin";

import AdminDashboard from "./components/AdminDashboard";

const services = [

  {

    number: "01",

    name: "Corte",

    description: "Consultoria, corte personalizado e finalização.",

    price: "R$ 40",

  },

  {

    number: "02",

    name: "Barba",

    description: "Toalha quente, desenho e acabamento preciso.",

    price: "R$ 30",

  },

  {

    number: "03",

    name: "Corte + Barba",

    description: "A experiência completa da casa.",

    price: "R$ 65",

  },

  {

    number: "04",

    name: "Acabamento",

    description: "Contorno, pezinho e acabamento.",

    price: "R$ 15",

  },

];

type Screen = "site" | "admin-login" | "admin";

function App() {

  const [menuOpen, setMenuOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  const [bookingOpen, setBookingOpen] = useState(false);

  const [screen, setScreen] = useState<Screen>("site");

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  // Revela cada elemento uma vez, quando ele entra na tela.
  useEffect(() => {
    if (checkingAuth || screen !== "site") return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !("IntersectionObserver" in window)) return;

    const elements = document.querySelectorAll<HTMLElement>(
      ".site .section-index, .site .about-text, .site .about-photo, " +
      ".site .services-heading, .site .service, .site .manifesto-content, " +
      ".site .team-heading, .site .barber-card, .site .space-photo, " +
      ".site .space-copy, .site .booking > *, .site .footer-top > *"
    );
    const revealAll = () => {
      elements.forEach((element) => element.classList.remove("reveal-pending"));
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    elements.forEach((element) => {
      element.classList.add("scroll-reveal", "reveal-pending");
      observer.observe(element);
    });
    preference.addEventListener("change", revealAll);

    return () => {
      observer.disconnect();
      preference.removeEventListener("change", revealAll);
      elements.forEach((element) => {
        element.classList.remove("scroll-reveal", "reveal-pending");
      });
    };
  }, [checkingAuth, screen]);
  // Scroll do header

  useEffect(() => {

    const handleScroll = () => {

      setScrolled(window.scrollY > 40);

    };

    window.addEventListener("scroll", handleScroll);

    return () => {

      window.removeEventListener("scroll", handleScroll);

    };

  }, []);

  // Bloqueia scroll quando modal/menu estiver aberto

  useEffect(() => {

    if (bookingOpen || menuOpen) {

      document.body.style.overflow = "hidden";

    } else {

      document.body.style.overflow = "";

    }

    return () => {

      document.body.style.overflow = "";

    };

  }, [bookingOpen, menuOpen]);

  // Verifica sessão administrativa

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      try {

        if (!user) {

          setIsAdmin(false);

          setCheckingAuth(false);

          return;

        }

        const adminReference = doc(db, "admins", user.uid);

        const adminSnapshot = await getDoc(adminReference);

        if (

          adminSnapshot.exists() &&

          adminSnapshot.data().ativo === true

        ) {

          setIsAdmin(true);

        } else {

          setIsAdmin(false);

          await signOut(auth);

        }

      } catch (error) {

        console.error(

          "Erro ao verificar administrador:",

          error

        );

        setIsAdmin(false);

        try {

          await signOut(auth);

        } catch {

          // Nenhuma ação necessária.

        }

      } finally {

        setCheckingAuth(false);

      }

    });

    return unsubscribe;

  }, []);

  const openBooking = () => {

    setBookingOpen(true);

    setMenuOpen(false);

  };

  const closeMenu = () => {

    setMenuOpen(false);

  };

  const openAdmin = () => {

    setMenuOpen(false);

    setBookingOpen(false);

    if (isAdmin) {

      setScreen("admin");

    } else {

      setScreen("admin-login");

    }

    window.scrollTo({

      top: 0,

      behavior: "instant",

    });

  };

  const backToSite = () => {

    setScreen("site");

    window.scrollTo({

      top: 0,

      behavior: "instant",

    });

  };

  const handleLoginSuccess = () => {

    setIsAdmin(true);

    setScreen("admin");

    window.scrollTo({

      top: 0,

      behavior: "instant",

    });

  };

  const handleLogout = async () => {

    try {

      await signOut(auth);

      setIsAdmin(false);

      setScreen("site");

      window.scrollTo({

        top: 0,

        behavior: "instant",

      });

    } catch (error) {

      console.error("Erro ao sair:", error);

    }

  };

  // Verificando autenticação

  if (checkingAuth) {

    return (

      <div className="admin-auth-loading">

        <div>

          <span>NOBRE</span>

          <small>BARBER CLUB</small>

        </div>

      </div>

    );

  }

  // Login administrativo

  if (screen === "admin-login") {

    return (

      <AdminLogin

        onBack={backToSite}

        onLoginSuccess={handleLoginSuccess}

      />

    );

  }

  // Dashboard administrativo

  if (screen === "admin") {

    if (!isAdmin) {

      return (

        <AdminLogin

          onBack={backToSite}

          onLoginSuccess={handleLoginSuccess}

        />

      );

    }

    return (

      <AdminDashboard

        onLogout={handleLogout}

        onBackToSite={backToSite}

      />

    );

  }

  // Site público

  return (

    <div className="site">

      {/* MODAL DE AGENDAMENTO */}

      <BookingModal

        isOpen={bookingOpen}

        onClose={() => setBookingOpen(false)}

      />

      {/* HEADER */}

      <header

        className={`header ${

          scrolled ? "header-scrolled" : ""

        }`}

      >

        <a
          className="brand brand-logo"
          href="#inicio"
          onClick={closeMenu}
          >
          <img
          src="/logo-nobre.png"
          alt="NOBRE Barber Club"
          />
          </a>

        <nav

          className={`navigation ${

            menuOpen ? "navigation-open" : ""

          }`}

        >

          <a href="#inicio" onClick={closeMenu}>

            Início

          </a>

          <a href="#sobre" onClick={closeMenu}>

            O Nobre

          </a>

          <a href="#servicos" onClick={closeMenu}>

            Serviços

          </a>

          <a href="#equipe" onClick={closeMenu}>

            Equipe

          </a>

          <a href="#espaco" onClick={closeMenu}>

            Espaço

          </a>

          <a href="#contato" onClick={closeMenu}>

            Contato

          </a>

          <button

            type="button"

            className="mobile-book"

            onClick={openBooking}

          >

            Reservar horário

            <FaArrowRight />

          </button>

        </nav>

        {/* SOMENTE RESERVAR NO TOPO */}

        <button

          type="button"

          className="header-book"

          onClick={openBooking}

        >

          Reservar

          <FaArrowRight />

        </button>

        <button

          type="button"

          className="menu-toggle"

          onClick={() =>

            setMenuOpen((current) => !current)

          }

          aria-label={

            menuOpen ? "Fechar menu" : "Abrir menu"

          }

          aria-expanded={menuOpen}

        >

          {menuOpen ? <FaTimes /> : <FaBars />}

        </button>

      </header>

      <main>

        {/* HERO */}

        <section className="hero" id="inicio">

          <div className="hero-image" />

          <div className="hero-shade" />

          <div className="hero-content">

            <p className="hero-kicker">

              Desde 2016 <span /> Barber Club

            </p>

            <h1>

              CORTE BEM FEITO

              <br />

              <em>NUNCA SAI DE MODA.</em>

            </h1>

            <p className="hero-copy">

              Seu estilo começa nos detalhes.

              <br />

              Aqui, cada corte é feito para combinar com você.

            </p>

            <button

              type="button"

              className="hero-book"

              onClick={openBooking}

            >

              <span>Reservar horário</span>

              <FaArrowRight />

            </button>

          </div>

          <div className="hero-footer">

            <span>Barbearia masculina</span>

            <a href="#sobre">

              Conheça o Nobre

              <span className="down-arrow">↓</span>

            </a>

            <span>Seg — Sáb</span>

          </div>

        </section>

        {/* SOBRE */}

        <section className="about" id="sobre">

          <div className="section-index">

            <span>01</span>

            <p>O Nobre</p>

          </div>

          <div className="about-content">

            <div className="about-text">

              <p className="small-title">

                NOSSA CASA

              </p>

              <h2>

                UMA BARBEARIA

                <br />

                FEITA PARA <i>VOCÊ VOLTAR.</i>

              </h2>

              <p className="about-description">

                No Nobre, cada atendimento começa com uma boa

                conversa. Entendemos o seu estilo, cuidamos dos

                detalhes e fazemos cada serviço no tempo certo.

              </p>

              <p className="about-description">

                Um ambiente confortável, profissionais preparados

                e aquele cuidado que transforma uma simples ida à

                barbearia em parte da sua rotina.

              </p>

              <a

                href="#espaco"

                className="text-link"

              >

                Conheça nosso espaço

                <FaArrowRight />

              </a>

            </div>

            <div className="about-photo">

              <img

                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=90"

                alt="Interior de uma barbearia"

              />

              <div className="photo-caption">

                <span>NOBRE BARBER CLUB</span>

                <span>EST. 2016</span>

              </div>

            </div>

          </div>

        </section>

        {/* SERVIÇOS */}

        <section

          className="services"

          id="servicos"

        >

          <div className="section-index light-index">

            <span>02</span>

            <p>Serviços</p>

          </div>

          <div className="services-heading">

            <p className="small-title">

              MENU DA CASA

            </p>

            <h2>

              ESCOLHA

              <br />

              <i>O SEU.</i>

            </h2>

            <p>

              Do corte tradicional ao cuidado completo. Escolha o

              serviço e encontre um horário para você.

            </p>

          </div>

          <div className="service-list">

            {services.map((service) => (

              <button

                type="button"

                className="service"

                key={service.name}

                onClick={openBooking}

              >

                <span className="service-number">

                  {service.number}

                </span>

                <div className="service-name">

                  <h3>{service.name}</h3>

                  <p>{service.description}</p>

                </div>

                <strong>{service.price}</strong>

                <span className="service-arrow">

                  ↗

                </span>

              </button>

            ))}

          </div>

        </section>

        {/* MANIFESTO */}

        <section className="manifesto">

          <div className="manifesto-photo" />

          <div className="manifesto-content">

            <span>NOBRE / BARBER CLUB</span>

            <blockquote>

              “Estilo não precisa

              <br />

              chamar atenção.

              <br />

              <i>Precisa ter identidade.</i>”

            </blockquote>

          </div>

        </section>

        {/* EQUIPE */}

        <section

          className="team"

          id="equipe"

        >

          <div className="section-index">

            <span>03</span>

            <p>Equipe</p>

          </div>

          <div className="team-heading">

            <div>

              <p className="small-title">

                QUEM FAZ ACONTECER

              </p>

              <h2>

                QUEM CUIDA

                <br />

                DO SEU <i>ESTILO.</i>

              </h2>

            </div>

            <p>

              Profissionais que entendem que cada cliente, cada

              cabelo e cada barba pedem um olhar diferente.

            </p>

          </div>

          <div className="team-grid">

            <article className="barber-card">

              <div className="barber-image barber-one" />

              <div className="barber-info">

                <div>

                  <span>BARBEIRO</span>

                  <h3>Rafael Nobre</h3>

                </div>

                <span>01</span>

              </div>

            </article>

            <article className="barber-card barber-card-offset">

              <div className="barber-image barber-two" />

              <div className="barber-info">

                <div>

                  <span>BARBEIRO</span>

                  <h3>Lucas Martins</h3>

                </div>

                <span>02</span>

              </div>

            </article>

          </div>

        </section>

        {/* ESPAÇO */}

        <section

          className="space"

          id="espaco"

        >

          <div className="space-photo space-photo-large" />

          <div className="space-copy">

            <span>04 / O ESPAÇO</span>

            <h2>

              SUA CADEIRA

              <br />

              ESTÁ <i>ESPERANDO.</i>

            </h2>

            <p>

              Um lugar feito para desacelerar. Café passado, boa

              música e uma cadeira esperando por você.

            </p>

          </div>

          <div className="space-photo space-photo-small" />

        </section>

        {/* AGENDAMENTO */}

        <section

          className="booking"

          id="agendamento"

        >

          <span className="booking-label">

            RESERVE SUA CADEIRA

          </span>

          <h2>

            HORA DE DAR

            <br />

            UM TRATO <i>NO VISUAL?</i>

          </h2>

          <p>

            Reserve seu horário em poucos passos.

          </p>

          <button

            type="button"

            className="booking-button"

            onClick={openBooking}

          >

            Agendar agora

            <FaArrowRight />

          </button>

          <span className="booking-note">

            Agendamento rápido • sem necessidade de cadastro

          </span>

        </section>

      </main>

      {/* FOOTER */}

      <footer

        className="footer"

        id="contato"

      >

        <div className="footer-top">

          <div className="footer-brand">

            <span>NOBRE</span>

            <small>BARBER CLUB</small>

          </div>

          <div className="footer-column">

            <span>ENDEREÇO</span>

            <p>Rua Exemplo, 120</p>

            <p>Centro</p>

          </div>

          <div className="footer-column">

            <span>HORÁRIOS</span>

            <p>

              Segunda — Sexta / 09h — 20h

            </p>

            <p>

              Sábado / 08h — 18h

            </p>

          </div>

          <div className="footer-column">

  <span>CONTATO</span>

  <a

    href="https://wa.me/5584981017508?text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20NOBRE%20Barber%20Club%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es."

    target="_blank"

    rel="noreferrer"

  >

    <FaWhatsapp />

    (84) 98101-7508

  </a>

  <a

    href="https://instagram.com/"

    target="_blank"

    rel="noreferrer"

  >

    <FaInstagram />

    Instagram

  </a>

          </div>

          {/* ADMIN SOMENTE NO RODAPÉ */}

          <div className="footer-column">

            <span>GESTÃO</span>

            <button

              type="button"

              className="footer-admin"

              onClick={openAdmin}

            >

              Acesso administrativo

              <FaArrowRight />

            </button>

          </div>

        </div>

        <div className="footer-bottom">

          <span>

            © 2026 NOBRE BARBER CLUB

          </span>

          <span>

            BARBEARIA • ESTILO • IDENTIDADE

          </span>

          <span>

            DESENVOLVIDO POR MARIA GRAZIELLY

          </span>

        </div>

      </footer>

    </div>

  );

}

export default App;