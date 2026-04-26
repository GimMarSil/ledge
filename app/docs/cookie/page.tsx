import config from "@/lib/config"

export default async function Cookie() {
  const { title, supportEmail, legalEntity, legalDomain } = config.app
  const effectiveDate = "26 de abril de 2026"

  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 border-b pb-2">Política de Cookies</h1>

      <p className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <strong>Data de entrada em vigor:</strong> {effectiveDate}
        <br />
        <strong>Serviço:</strong>{" "}
        <a href={`https://${legalDomain}`} className="text-blue-600 hover:text-blue-800">
          https://{legalDomain}
        </a>
        <br />
        <strong>Responsável:</strong> {legalEntity}
        <br />
        <strong>Contacto:</strong>{" "}
        <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {supportEmail}
        </a>
      </p>

      <p className="text-slate-700 mb-6 leading-relaxed">
        Esta Política de Cookies explica como o {title} utiliza cookies e tecnologias semelhantes para o reconhecer enquanto utilizador, melhorar a sua experiência, e cumprir obrigações legais.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. O que são cookies</h2>
      <p className="text-slate-700 mb-6">
        Cookies são pequenos ficheiros de texto que o navegador guarda no seu dispositivo quando visita um website. Permitem ao site lembrar-se das suas preferências, manter sessões de autenticação, e medir utilização agregada.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Cookies que utilizamos</h2>

      <h3 className="text-xl font-semibold text-slate-800 mb-2">2.1 Estritamente necessários (não requerem consentimento)</h3>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li><strong>Sessão de autenticação:</strong> mantém o login activo durante a visita.</li>
        <li><strong>CSRF token:</strong> protege contra ataques de cross-site request forgery.</li>
        <li><strong>Preferência de idioma:</strong> recorda o idioma escolhido (pt-PT, en-GB, ...).</li>
        <li><strong>Aceitação de cookies:</strong> regista a sua decisão para não voltar a perguntar.</li>
      </ul>

      <h3 className="text-xl font-semibold text-slate-800 mb-2">2.2 Funcionais (requerem consentimento)</h3>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li><strong>Preferências de UI:</strong> tema escuro/claro, layout de tabelas, filtros guardados.</li>
      </ul>

      <h3 className="text-xl font-semibold text-slate-800 mb-2">2.3 Analíticos (requerem consentimento)</h3>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li>Métricas agregadas e anonimizadas de utilização do produto, sem identificadores pessoais persistidos por terceiros.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Gerir o seu consentimento</h2>
      <p className="text-slate-700 mb-6">
        Pode aceitar, recusar ou alterar o consentimento de cookies não-essenciais a qualquer momento através do banner de cookies ou nas definições do seu navegador. A recusa de cookies analíticos não impede o acesso ao serviço.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Cookies de terceiros</h2>
      <p className="text-slate-700 mb-3">Utilizamos os seguintes serviços de terceiros que podem definir os seus próprios cookies:</p>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li><strong>Stripe</strong>: prevenção de fraude no checkout (apenas em páginas de pagamento).</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Conservação</h2>
      <p className="text-slate-700 mb-6">
        Cookies de sessão expiram ao fechar o navegador. Cookies persistentes têm validade entre 30 dias (preferências) e 12 meses (autenticação).
      </p>

      <p className="text-slate-700 mt-8 text-sm border-t pt-4">
        Para mais informação consulte a nossa{" "}
        <a href="/docs/privacy_policy" className="text-blue-600 hover:text-blue-800">Política de Privacidade</a>{" "}
        ou contacte{" "}
        <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {supportEmail}
        </a>
        .
      </p>
    </div>
  )
}
