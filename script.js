// Alternância entre abas
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const tipo = tab.getAttribute("data-tab");

        if (tipo === "diario") carregarDiario();
        if (tipo === "mensal") carregarMensal();
        if (tipo === "anual") carregarAnual();
    });
});

// Trocar tema claro/escuro
document.getElementById("toggleTheme").addEventListener("click", () => {
    document.body.classList.toggle("light");
});

// Conteúdos das abas
function carregarDiario() {
    document.getElementById("content").innerHTML = `
        <h2 class="section-title">Resumo Diário</h2>

        <div class="card green">
            <span class="card-title">Ativações Hoje</span>
            <span class="card-value">12</span>
        </div>

        <div class="card blue">
            <span class="card-title">Clientes Ativos</span>
            <span class="card-value">812</span>
        </div>

        <button class="btn btn-green">Registrar Ativação</button>
    `;
}

function carregarMensal() {
    document.getElementById("content").innerHTML = `
        <h2 class="section-title">Resumo Mensal</h2>

        <div class="card purple">
            <span class="card-title">Ativações no Mês</span>
            <span class="card-value">211</span>
        </div>
    `;
}

function carregarAnual() {
    document.getElementById("content").innerHTML = `
        <h2 class="section-title">Resumo Anual</h2>

        <div class="card yellow">
            <span class="card-title">Total no Ano</span>
            <span class="card-value">1340</span>
        </div>
    `;
}