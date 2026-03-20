import React from "react"
import { EmailLayout } from "./email-layout"

export const NewsletterWelcomeEmail: React.FC = () => (
  <EmailLayout preview="Bem-vindo ao Ledge!">
    <h2 style={{ color: "#00C2A8" }}>👋 Bem-vindo ao Ledge!</h2>

    <p style={{ fontSize: "16px", lineHeight: "1.5", color: "#333" }}>
      Obrigado por subscrever as nossas atualizações. Iremos mantê-lo informado sobre:
    </p>
    <ul
      style={{
        paddingLeft: "20px",
        fontSize: "16px",
        lineHeight: "1.5",
        color: "#333",
      }}
    >
      <li>Novas funcionalidades e melhorias</li>
      <li>Os nossos planos e calendário</li>
      <li>Atualizações do serviço</li>
    </ul>
    <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
      <p style={{ fontSize: "16px", color: "#333" }}>
        Com os melhores cumprimentos,
        <br />
        A equipa Ledge
      </p>
    </div>
  </EmailLayout>
)
