import React, { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import * as api from "../api";
import { GoogleLogin } from "@react-oauth/google";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      if (mode === "login") {
        const res = await api.login(username, password);
        if (res && res.token) {
          onLogin(res.token);
          setMsg("Logged in");
        } else {
          setMsg(res.error || "Error");
        }
      } else {
        if (!captchaToken) {
          setMsg("Please complete the captcha");
          return;
        }
        const res = await api.register(username, password, captchaToken);
        if (res && res.token) {
          onLogin(res.token);
          setMsg("Registered and logged in");
        } else {
          setMsg(res.error || "Error");
        }
      }
    } catch (e) {
      setMsg(e.message || "Error");
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setMsg("");
    try {
      const token = credentialResponse?.credential;
      if (!token) {
        setMsg("Google login failed");
        return;
      }
      const res = await fetch("/api/login/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data && data.token) {
        onLogin(data.token);
        setMsg("Logged in");
      } else {
        setMsg(data.error || "Error");
      }
    } catch (e) {
      setMsg(e.message || "Error");
    }
  }

  function handleGoogleError() {
    setMsg("Google login failed");
  }

  return (
    <div className="auth card">
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={submit}>
        <input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {mode === "register" && (
          <ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITEKEY} onChange={token => setCaptchaToken(token)} />
        )}
        <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
      </div>
      <p>
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          Switch to {mode === "login" ? "Register" : "Login"}
        </button>
      </p>
      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
