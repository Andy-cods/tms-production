"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [email,setEmail]=useState(""); const [name,setName]=useState("");
  const [password,setPassword]=useState(""); const [msg,setMsg]=useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    const res = await fetch("/api/register", { method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, name, password }) });
    const json = await res.json();
    setMsg(json.ok ? "Tạo tài khoản thành công. Hãy đăng nhập!" : (json.message || "Lỗi"));
    if (json.ok) window.location.href = "/login";
  }

  return (
    <div style={{maxWidth:420, margin:"80px auto", fontFamily:"sans-serif"}}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Đăng ký</h1>
      <form onSubmit={onSubmit}>
        <label>Họ tên</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} required style={{width:"100%",padding:8,margin:"4px 0 12px"}}/>
        <label>Email</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{width:"100%",padding:8,margin:"4px 0 12px"}}/>
        <label>Mật khẩu</label>
        <input
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
          minLength={8}
          title="Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
          style={{width:"100%",padding:8,margin:"4px 0 12px"}}
        />
        <p style={{ fontSize: 12, color: "#666", marginTop: -6, marginBottom: 12 }}>
          Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
        </p>
        {msg && <p style={{marginBottom:12}}>{msg}</p>}
        <button type="submit" style={{width:"100%",padding:10,background:"#000",color:"#fff",border:"none",cursor:"pointer"}}>Tạo tài khoản</button>
      </form>
      <p style={{ marginTop:16 }}>Đã có tài khoản? <a href="/login">Đăng nhập</a></p>
    </div>
  );
}
