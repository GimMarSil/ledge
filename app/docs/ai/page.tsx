import config from "@/lib/config"

export default async function AI() {
  const { title, supportEmail, legalEntity, legalDomain } = config.app
  const effectiveDate = "26 de abril de 2026"

  return (
    <div className="prose prose-slate max-w-none">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6 border-b pb-2">
        Divulgação sobre Utilização de Inteligência Artificial
      </h1>

      <p className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <strong>Data de entrada em vigor:</strong> {effectiveDate}
        <br />
        <strong>Responsável:</strong> {legalEntity}
        <br />
        <strong>Domínio:</strong>{" "}
        <a href={`https://${legalDomain}`} className="text-blue-600 hover:text-blue-800">
          https://{legalDomain}
        </a>
        <br />
        <strong>Contacto:</strong>{" "}
        <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {supportEmail}
        </a>
      </p>

      <p className="text-slate-700 mb-6 leading-relaxed">
        O {title} utiliza modelos de Inteligência Artificial (IA) para automatizar a extração de dados a partir de imagens e PDFs de faturas, recibos e outros documentos fiscais. Esta divulgação descreve como, com que prestadores, e com que limites.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Onde usamos IA</h2>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li><strong>OCR de documentos:</strong> reconhecimento de texto em imagens e PDFs.</li>
        <li><strong>Extração estruturada:</strong> identificação de campos como NIF, valor, data, fornecedor, IVA.</li>
        <li><strong>Categorização:</strong> sugestão de categoria fiscal com base no conteúdo do documento.</li>
        <li><strong>Validação:</strong> deteção de inconsistências (ex: total ≠ subtotal + IVA, NIF inválido).</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Prestadores de IA</h2>
      <p className="text-slate-700 mb-3">Recorremos aos seguintes prestadores, configuráveis por instância:</p>
      <ul className="list-disc pl-6 mb-6 space-y-2 text-slate-700">
        <li><strong>OpenAI (GPT-4o, GPT-4o-mini):</strong> processamento padrão. Os documentos enviados não são utilizados para treinar modelos da OpenAI (opt-out via Enterprise / API).</li>
        <li><strong>Google (Gemini):</strong> alternativa para idiomas e formatos específicos.</li>
        <li><strong>Mistral:</strong> alternativa europeia para clientes que prefiram processamento na UE.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Que dados são enviados aos prestadores</h2>
      <p className="text-slate-700 mb-6">
        Apenas o conteúdo do documento (imagem ou texto extraído). Não enviamos identificadores pessoais do utilizador (nome, email, ID interno) nem metadados da conta. As respostas dos modelos não são partilhadas com terceiros.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Limitações e responsabilidade humana</h2>
      <p className="text-slate-700 mb-6">
        A IA é uma ferramenta de assistência. Os dados extraídos automaticamente devem ser <strong>sempre validados pelo utilizador</strong> antes de serem usados para fins fiscais (declaração de IVA, IRS, IES, exportação SAF-T). {legalEntity} não se responsabiliza por erros de classificação ou extração que não tenham sido validados antes da submissão à Autoridade Tributária.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Conformidade com o AI Act europeu</h2>
      <p className="text-slate-700 mb-6">
        O sistema enquadra-se no Regulamento (UE) 2024/1689 (AI Act) como sistema de IA de risco limitado: aplica-se transparência (este documento) mas não requer avaliação de conformidade adicional. Os utilizadores são informados de que estão a interagir com um sistema de IA sempre que aplicável.
      </p>

      <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Os seus direitos</h2>
      <p className="text-slate-700 mb-6">
        Pode opor-se ao processamento por IA contactando{" "}
        <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-800">
          {supportEmail}
        </a>
        . Nesse caso, o processamento dos seus documentos passa a ser exclusivamente manual, podendo afetar a velocidade do serviço.
      </p>

      <p className="text-slate-700 mt-8 text-sm border-t pt-4">
        Para mais detalhes consulte a{" "}
        <a href="/docs/privacy_policy" className="text-blue-600 hover:text-blue-800">
          Política de Privacidade
        </a>
        .
      </p>
    </div>
  )
}
