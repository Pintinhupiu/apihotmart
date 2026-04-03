export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", maxWidth: "600px" }}>
      <h1>Apphotmart API</h1>
      <p>Backend de automação de onboarding — Mentoria Passo 0</p>
      <hr />
      <h2>Endpoints disponíveis</h2>
      <ul>
        <li><strong>POST</strong> /api/forms/submit — Receber lead do formulário</li>
        <li><strong>POST</strong> /api/hotmart/webhook — Webhook de compra aprovada</li>
        <li><strong>GET</strong> /api/health — Health check</li>
      </ul>
    </main>
  );
}
