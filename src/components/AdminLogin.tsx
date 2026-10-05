import { useState } from "react";
import type { FormEvent } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaLock,
} from "react-icons/fa";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import "./AdminLogin.css";

interface AdminLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

function AdminLogin({
  onBack,
  onLoginSuccess,
}: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }

    try {
      setLoading(true);

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const adminReference = doc(
        db,
        "admins",
        credential.user.uid
      );

      const adminSnapshot =
        await getDoc(adminReference);

      if (
        !adminSnapshot.exists() ||
        adminSnapshot.data().ativo !== true
      ) {
        await signOut(auth);

        setError(
          "Esta conta não possui acesso administrativo."
        );

        return;
      }

      onLoginSuccess();
    } catch (loginError) {
      console.error(
        "Erro no login administrativo:",
        loginError
      );

      setError(
        "E-mail ou senha incorretos. Confira os dados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-left">
        <button
          type="button"
          className="admin-back"
          onClick={onBack}
        >
          <FaArrowLeft />
          Voltar para o site
        </button>

        <div className="admin-login-brand">
          <span>NOBRE</span>
          <small>BARBER CLUB</small>
        </div>

        <div className="admin-login-message">
          <span>ÁREA RESTRITA</span>

          <h1>
            Gestão simples.
            <br />
            <i>Rotina organizada.</i>
          </h1>

          <p>
            Acompanhe os atendimentos e mantenha a
            agenda da barbearia organizada em um só
            lugar.
          </p>
        </div>

        <div className="admin-login-footer">
          <span>NOBRE / ADMIN</span>
          <span>© 2026</span>
        </div>
      </div>

      <div className="admin-login-right">
        <div className="admin-form-wrapper">
          <div className="admin-lock">
            <FaLock />
          </div>

          <span className="admin-eyebrow">
            ACESSO ADMINISTRATIVO
          </span>

          <h2>
            Bem-vindo
            <br />
            <i>de volta.</i>
          </h2>

          <p className="admin-form-description">
            Entre com suas credenciais para acessar
            o painel.
          </p>

          <form
            className="admin-form"
            onSubmit={handleSubmit}
          >
            <label>
              <span>E-MAIL</span>

              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                autoComplete="email"
                disabled={loading}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
              />
            </label>

            <label>
              <span>SENHA</span>

              <div className="admin-password">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Sua senha"
                  value={password}
                  autoComplete="current-password"
                  disabled={loading}
                  onChange={(event) => {
                    setPassword(
                      event.target.value
                    );

                    setError("");
                  }}
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="admin-login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="admin-submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Entrando..."
                  : "Entrar no painel"}
              </span>

              {!loading && <FaArrowRight />}
            </button>
          </form>

          <p className="admin-security">
            <FaLock />
            Acesso exclusivo para administradores
            autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;