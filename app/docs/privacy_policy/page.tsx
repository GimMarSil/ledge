import config from "@/lib/config"

export default async function PrivacyPolicy() {
  const { title, supportEmail, legalEntity, legalDomain } = config.app
  const effectiveDate = "26 de abril de 2026"

  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 border-b pb-2">Política de Privacidade</h1>

      <p className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <strong>Data de entrada em vigor:</strong> {effectiveDate}
        <br />
        <strong>Responsável pelo tratamento:</strong> {legalEntity}
        <br />
        <strong>Email de contacto / DPO:</strong>{" "}
        <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {supportEmail}
        </a>
        <br />
        <strong>Domínio:</strong>{" "}
        <a href={`https://${legalDomain}`} className="text-blue-600 hover:text-blue-800">
          https://{legalDomain}
        </a>
      </p>

      <p className="text-slate-700 mb-6 leading-relaxed">
        {legalEntity} (&quot;nós&quot;) compromete-se a proteger os dados pessoais dos utilizadores do {title} (&quot;serviço&quot;) em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD, Regulamento UE 2016/679) e a legislação portuguesa aplicável. Esta política descreve quais os dados que recolhemos, como os utilizamos, como os protegemos, e os seus direitos.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Dados que tratamos</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li><strong>Conta:</strong> nome, email, função, organização, NIF/NIPC, contactos.</li>
        <li><strong>Documentos carregados:</strong> faturas, recibos, contratos e respetivos metadados (fornecedor, NIF, valor, IVA, data).</li>
        <li><strong>Utilização:</strong> logs de acesso, IP, user-agent, eventos de auditoria, eventos de uso (para faturação e métricas).</li>
        <li><strong>Pagamentos:</strong> processados via Stripe; não armazenamos dados completos de cartão.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Finalidades e base legal</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li><strong>Execução do contrato (art. 6.º, n.º 1, b) RGPD):</strong> fornecer o serviço subscrito.</li>
        <li><strong>Obrigação legal (art. 6.º, n.º 1, c) RGPD):</strong> conservação de documentos fiscais por 10 anos conforme art. 123.º-A do CIVA.</li>
        <li><strong>Interesse legítimo (art. 6.º, n.º 1, f) RGPD):</strong> segurança da plataforma, prevenção de fraude, melhoria do serviço.</li>
        <li><strong>Consentimento (art. 6.º, n.º 1, a) RGPD):</strong> cookies não-essenciais e comunicações de marketing.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Subcontratantes (sub-processadores)</h2>
      <p className="text-slate-700 mb-3">Recorremos aos seguintes prestadores, todos vinculados por contrato e em conformidade com o RGPD:</p>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li><strong>Hetzner Online GmbH</strong> (Alemanha): infraestrutura de servidores.</li>
        <li><strong>OpenAI / Google / Mistral</strong>: processamento de OCR (apenas o conteúdo do documento; sem identificadores pessoais persistidos pelo prestador).</li>
        <li><strong>Stripe Payments Europe</strong>: processamento de pagamentos.</li>
        <li><strong>Resend</strong>: envio de emails transacionais.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Conservação</h2>
      <p className="text-slate-700 mb-6">
        Documentos fiscais (faturas, SAF-T): 10 anos a contar do fim do exercício, conforme obrigação legal portuguesa. Logs de acesso e auditoria: 12 meses. Após cessação do contrato, os dados são exportáveis durante 90 dias e depois eliminados de forma irreversível.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Os seus direitos</h2>
      <p className="text-slate-700 mb-3">Como titular dos dados pode, a qualquer momento:</p>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>Aceder e obter cópia dos seus dados (direito de acesso e portabilidade);</li>
        <li>Corrigir dados incorretos ou desatualizados (direito de retificação);</li>
        <li>Solicitar a eliminação dos dados, sem prejuízo das obrigações legais de conservação (direito ao apagamento);</li>
        <li>Solicitar a limitação ou opor-se a determinados tratamentos;</li>
        <li>Retirar consentimento previamente dado.</li>
      </ul>
      <p className="text-slate-700 mb-6">
        Para exercer estes direitos contacte{" "}
        <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {supportEmail}
        </a>
        . Respondemos no prazo máximo de 30 dias. Pode também apresentar reclamação à <a href="https://www.cnpd.pt" className="text-blue-600 hover:text-blue-800">Comissão Nacional de Proteção de Dados (CNPD)</a>.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Segurança</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>Encriptação em trânsito (TLS 1.3) e em repouso (AES-256);</li>
        <li>Autenticação multi-fator (MFA) obrigatória para todas as contas pagas;</li>
        <li>Backups diários encriptados, com retenção de 30 dias;</li>
        <li>Logs de auditoria imutáveis para todos os acessos administrativos;</li>
        <li>Isolamento de instâncias por cliente (modelo dedicated-per-tenant).</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Transferências internacionais</h2>
      <p className="text-slate-700 mb-6">
        Os dados são armazenados em servidores na União Europeia (Alemanha). Algumas integrações (OpenAI, Stripe) podem implicar transferências para fora da UE; nesses casos aplicam-se Cláusulas Contratuais-Tipo aprovadas pela Comissão Europeia.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Alterações</h2>
      <p className="text-slate-700 mb-6">
        Atualizações materiais a esta Política são comunicadas com 30 dias de antecedência por email para o endereço associado à conta.
      </p>

      <p className="text-slate-700 mt-8 text-sm border-t pt-4">
        Em caso de dúvida sobre o tratamento dos seus dados pessoais, contacte{" "}
        <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {supportEmail}
        </a>
        .
      </p>
    </div>
  )
}
