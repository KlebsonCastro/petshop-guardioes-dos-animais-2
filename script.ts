// ==============================================
// 1. INTERFACES (Sem mudanças)
// ... (código omitido) ...
// ==============================================
interface Animal {
    id: number;
    nome: string;
    especie: string;
    idade: number;
    peso: number;
    vacinado: boolean;
    dono: string; 
}
interface Servico {
    id: number;
    tipo: 'banho' | 'consulta' | 'vacinação'; 
    animalId: number;
    preco: number;
    concluido: boolean;
    dataAgendamento: string; 
    dono: string; 
}

// ==============================================
// 2. "BANCO DE DADOS" (Sem mudanças)
// ... (código omitido) ...
// ==============================================
const DB_ANIMALS = 'petshop_animais';
const DB_SERVICOS = 'petshop_servicos';
function getAnimais(): Animal[] {
    const data = localStorage.getItem(DB_ANIMALS);
    return data ? JSON.parse(data) : [];
}
function saveAnimais(animais: Animal[]): void {
    localStorage.setItem(DB_ANIMALS, JSON.stringify(animais));
}
function getServicos(): Servico[] {
    const data = localStorage.getItem(DB_SERVICOS);
    return data ? JSON.parse(data) : [];
}
function saveServicos(servicos: Servico[]): void {
    localStorage.setItem(DB_SERVICOS, JSON.stringify(servicos));
}

// ==============================================
// 3. MÓDULO DE AUTENTICAÇÃO (Sem mudanças)
// ... (código omitido) ...
// ==============================================
const AUTH_KEY = 'petshop_user';
function login(username: string, pass: string): boolean {
    if (pass !== '1234') return false;
    const clientes = ['usuario1', 'usuario2', 'usuario3'];
    if (clientes.includes(username) || username === 'administrador') {
        sessionStorage.setItem(AUTH_KEY, username);
        return true;
    }
    return false;
}
function logout(): void {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html';
}
function getLoggedInUser(): string | null {
    return sessionStorage.getItem(AUTH_KEY);
}
function isUserAdmin(): boolean {
    return getLoggedInUser() === 'administrador';
}
function checkAuth(pageType: 'admin' | 'client' | 'login'): void {
    const user = getLoggedInUser();
    if (pageType === 'login') {
        if (user) { 
            window.location.href = isUserAdmin() ? 'admin.html' : 'cliente.html';
        }
        return;
    }
    if (!user) { 
        window.location.href = 'index.html';
        return;
    }
    if (pageType === 'admin' && !isUserAdmin()) { 
        window.location.href = 'cliente.html';
    }
    if (pageType === 'client' && isUserAdmin()) { 
        window.location.href = 'admin.html';
    }
}

// ==============================================
// 4. LÓGICA DE NEGÓCIO (Sem mudanças)
// ... (código omitido) ...
// ==============================================
function getMeusAnimais(): Animal[] {
    const user = getLoggedInUser();
    return getAnimais().filter(animal => animal.dono === user);
}
function getMeusServicos(): Servico[] {
    const user = getLoggedInUser();
    return getServicos().filter(servico => servico.dono === user);
}
function calcularTotalMeusServicos(): number {
    const user = getLoggedInUser();
    if (!user) return 0;
    const meusServicos = getServicos().filter(s => s.dono === user && !s.concluido);
    let total = 0;
    meusServicos.forEach(servico => {
        total += servico.preco;
    });
    return total;
}
function cadastrarMeuAnimal(nome: string, especie: string, anoNascimento: number, peso: number, vacinado: boolean): string {
    const user = getLoggedInUser();
    if (!user) return "Erro: Usuário não logado.";
    const todosAnimais = getAnimais();
    const idade = new Date().getFullYear() - anoNascimento;
    const novoAnimal: Animal = {
        id: Date.now(),
        nome,
        especie,
        idade,
        peso,
        vacinado: vacinado,
        dono: user
    };
    todosAnimais.push(novoAnimal);
    saveAnimais(todosAnimais);
    return `✅ Animal "${nome}" cadastrado com sucesso!`;
}
function agendarMeuServico(animalId: number, tipo: Servico['tipo'], data: string): string {
    const user = getLoggedInUser();
    const animal = getMeusAnimais().find(a => a.id === animalId);
    if (!user) return "Erro: Usuário não logado.";
    if (!animal) return "❌ Erro: Animal não encontrado ou não pertence a você.";
    const precos = { 'banho': 50.00, 'consulta': 100.00, 'vacinação': 80.00 };
    const todosServicos = getServicos();
    const novoServico: Servico = {
        id: Date.now(),
        animalId: animalId,
        tipo: tipo,
        preco: precos[tipo],
        concluido: false,
        dataAgendamento: data,
        dono: user
    };
    todosServicos.push(novoServico);
    saveServicos(todosServicos);
    return `✅ Serviço de ${tipo} agendado para ${animal.nome} em ${data}!`;
}
function getAnimaisNaoVacinados(): Animal[] {
    return getAnimais().filter(animal => !animal.vacinado);
}
function calcularEstatisticasServicos(): { total: number, pendente: number, concluido: number } {
    const todosServicos = getServicos();
    let total = 0;
    let pendente = 0;
    let concluido = 0;
    todosServicos.forEach(servico => {
        total += servico.preco;
        if (servico.concluido) {
            concluido += servico.preco;
        } else {
            pendente += servico.preco;
        }
    });
    return { total, pendente, concluido };
}
function marcarComoVacinado(animalId: number): string {
    const todosAnimais = getAnimais();
    const animalIndex = todosAnimais.findIndex(a => a.id === animalId);
    
    if (animalIndex > -1) {
        todosAnimais[animalIndex].vacinado = true;
        saveAnimais(todosAnimais);
        return `✅ ${todosAnimais[animalIndex].nome} marcado como vacinado!`;
    }
    return "❌ Animal não encontrado!";
}

// ==============================================
// 5. RENDERIZAÇÃO (Funções que desenham na tela)
// ... (Funções renderForm..., renderMeus..., renderAdmin... sem mudanças) ...
// ==============================================
const resultadoEl = document.getElementById('resultado');
function renderFormCadastrarAnimal(): void {
    if (!resultadoEl) return;
    resultadoEl.innerHTML = `
        <div class="form-card">
            <h3>➕ Cadastrar Novo Animal</h3>
            <form id="form-cadastrar-animal">
                <div class="form-group">
                    <label for="animal-nome">Nome do Animal</label>
                    <input type="text" id="animal-nome" required>
                </div>
                <div class="form-group">
                    <label for="animal-especie">Espécie (cachorro, gato, etc)</label>
                    <input type="text" id="animal-especie" required>
                </div>
                <div class="form-group">
                    <label for="animal-ano">Ano de Nascimento</label>
                    <input type="number" id="animal-ano" required min="2000" max="${new Date().getFullYear()}">
                </div>
                <div class="form-group">
                    <label for="animal-peso">Peso (kg)</label>
                    <input type="number" id="animal-peso" step="0.1" required>
                </div>
                <div class="form-group">
                    <label for="animal-vacinado">Já é vacinado?</label>
                    <select id="animal-vacinado" required>
                        <option value="false">Não</option>
                        <option value="true">Sim</option>
                    </select>
                </div>
                <button type="submit">Cadastrar</button>
            </form>
        </div>
    `;
    document.getElementById('form-cadastrar-animal')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = (document.getElementById('animal-nome') as HTMLInputElement).value;
        const especie = (document.getElementById('animal-especie') as HTMLInputElement).value;
        const ano = parseInt((document.getElementById('animal-ano') as HTMLInputElement).value);
        const peso = parseFloat((document.getElementById('animal-peso') as HTMLInputElement).value);
        const vacinado = (document.getElementById('animal-vacinado') as HTMLSelectElement).value === 'true';
        const msg = cadastrarMeuAnimal(nome, especie, ano, peso, vacinado);
        alert(msg);
        renderMeusAnimais();
    });
}
function renderFormAgendarServico(): void {
    if (!resultadoEl) return;
    const meusAnimais = getMeusAnimais();
    if (meusAnimais.length === 0) {
        resultadoEl.innerHTML = `
            <div class="erro-card">
                <h3>❌ Nenhum animal cadastrado</h3>
                <p>Você precisa cadastrar um animal antes de agendar um serviço.</p>
                <button id="btn-ir-cadastro">Cadastrar Animal Agora</button>
            </div>
        `;
        document.getElementById('btn-ir-cadastro')?.addEventListener('click', renderFormCadastrarAnimal);
        return;
    }
    const opcoesAnimais = meusAnimais.map(animal => 
        `<option value="${animal.id}">${animal.nome} (${animal.especie})</option>`
    ).join('');
    resultadoEl.innerHTML = `
        <div class="form-card">
            <h3>📅 Agendar Serviço</h3>
            <form id="form-agendar-servico">
                <div class="form-group">
                    <label for="servico-animal">Selecione o Animal</label>
                    <select id="servico-animal" required>
                        ${opcoesAnimais}
                    </select>
                </div>
                <div class="form-group">
                    <label for="servico-tipo">Tipo de Serviço</label>
                    <select id="servico-tipo" required>
                        <option value="banho">Banho (R$ 50,00)</option>
                        <option value="consulta">Consulta (R$ 100,00)</option>
                        <option value="vacinação">Vacinação (R$ 80,00)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="servico-data">Data do Agendamento</label>
                    <input type="date" id="servico-data" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                <button type="submit">Agendar</button>
            </form>
        </div>
    `;
    document.getElementById('form-agendar-servico')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const animalId = parseInt((document.getElementById('servico-animal') as HTMLSelectElement).value);
        const tipo = (document.getElementById('servico-tipo') as HTMLSelectElement).value as Servico['tipo'];
        const data = (document.getElementById('servico-data') as HTMLInputElement).value;
        const msg = agendarMeuServico(animalId, tipo, data);
        const total = calcularTotalMeusServicos();
        alert(`${msg}\n\n💸 Valor total dos seus agendamentos: R$ ${total.toFixed(2)}`);
        renderMeusServicos(); 
    });
}
function renderMeusAnimais(): void {
    if (!resultadoEl) return;
    const meusAnimais = getMeusAnimais();
    if (meusAnimais.length === 0) {
        resultadoEl.innerHTML = `<div class="animal-card"><p>Nenhum animal cadastrado ainda.</p></div>`;
        return;
    }
    let html = `<div class="animal-card"><h3>📝 Meus Animais Cadastrados</h3>`;
    meusAnimais.forEach(animal => {
        html += `
            <div class="animal-item">
                <h4>${animal.nome} (${animal.especie})</h4>
                <p><strong>Idade:</strong> ${animal.idade} anos | <strong>Peso:</strong> ${animal.peso} kg</p>
                <p><strong>Vacinado:</strong> ${animal.vacinado ? '✅ Sim' : '❌ Não'}</p>
            </div>
        `;
    });
    html += `<p><strong>Total:</strong> ${meusAnimais.length} animais</p></div>`;
    resultadoEl.innerHTML = html;
}
function renderMeusServicos(): void {
    if (!resultadoEl) return;
    const meusServicos = getMeusServicos();
    const meusAnimais = getMeusAnimais();
    if (meusServicos.length === 0) {
        resultadoEl.innerHTML = `<div class="animal-card"><p>Nenhum serviço agendado.</p></div>`;
        return;
    }
    let html = `<div class="animal-card"><h3>📋 Meus Agendamentos</h3>`;
    meusServicos.forEach(servico => {
        const animal = meusAnimais.find(a => a.id === servico.animalId);
        const animalNome = animal ? animal.nome : "Animal Removido";
        html += `
            <div class="servico-item">
                <h4>${servico.tipo.charAt(0).toUpperCase() + servico.tipo.slice(1)} - R$ ${servico.preco.toFixed(2)}</h4>
                <p><strong>Animal:</strong> ${animalNome}</p>
                <p><strong>Data:</strong> ${servico.dataAgendamento}</p>
                <p><strong>Status:</strong> ${servico.concluido ? '✅ Concluído' : '⏳ Pendente'}</p>
            </div>
        `;
    });
    const total = calcularTotalMeusServicos();
    html += `<hr style="margin: 15px 0;">
             <p style="font-weight:bold; font-size: 1.1rem;">
                <strong>Valor Total (Pendentes):</strong> R$ ${total.toFixed(2)}
             </p>
    `;
    html += `</div>`;
    resultadoEl.innerHTML = html;
}
function renderAdminDashboard(): void {
    const totalAnimais = getAnimais().length;
    const totalServicos = getServicos().length;
    const naoVacinados = getAnimaisNaoVacinados().length;
    const { total } = calcularEstatisticasServicos(); 
    (document.getElementById('total-animais-num') as HTMLElement).textContent = String(totalAnimais);
    (document.getElementById('total-servicos-num') as HTMLElement).textContent = String(totalServicos);
    (document.getElementById('nao-vacinados-num') as HTMLElement).textContent = String(naoVacinados);
    (document.getElementById('faturamento-total-num') as HTMLElement).textContent = total.toFixed(2);
}
function renderTodosAnimais(): void {
    if (!resultadoEl) return;
    const todosAnimais = getAnimais();
    if (todosAnimais.length === 0) {
        resultadoEl.innerHTML = `<div class="animal-card"><p>Nenhum animal cadastrado no sistema.</p></div>`;
        return;
    }
    let html = `<div class="animal-card"><h3>📝 Todos os Animais do Sistema</h3>`;
    todosAnimais.forEach(animal => {
        html += `
            <div class="animal-item">
                <h4>${animal.nome} (${animal.especie}) - <em>Dono: ${animal.dono}</em></h4>
                <p><strong>ID:</strong> ${animal.id} | <strong>Idade:</strong> ${animal.idade} anos</p>
                <p><strong>Vacinado:</strong> ${animal.vacinado ? '✅ Sim' : '❌ Não'}</p>
                <button class="${animal.vacinado ? 'btn-vacinado' : ''}" onclick="handleVacinar(${animal.id})" ${animal.vacinado ? 'disabled' : ''}>
                    ${animal.vacinado ? '✅ Vacinado' : '💉 Aplicar Vacina'}
                </button>
            </div>
        `;
    });
    html += `<p><strong>Total:</strong> ${todosAnimais.length} animais</p></div>`;
    resultadoEl.innerHTML = html;
}
(window as any).handleVacinar = (animalId: number) => {
    const msg = marcarComoVacinado(animalId);
    alert(msg);
    renderTodosAnimais(); 
    renderAdminDashboard(); 
};
function renderTodosServicos(): void {
    if (!resultadoEl) return;
    const todosServicos = getServicos();
    const todosAnimais = getAnimais();
    if (todosServicos.length === 0) {
        resultadoEl.innerHTML = `<div class="animal-card"><p>Nenhum serviço agendado no sistema.</p></div>`;
        return;
    }
    let html = `<div class="animal-card"><h3>📋 Todos os Agendamentos</h3>`;
    todosServicos.forEach(servico => {
        const animal = todosAnimais.find(a => a.id === servico.animalId);
        const animalNome = animal ? animal.nome : "Animal Removido";
        html += `
            <div class="servico-item">
                <h4>${servico.tipo} - R$ ${servico.preco.toFixed(2)} (Dono: ${servico.dono})</h4>
                <p><strong>Animal:</strong> ${animalNome}</p>
                <p><strong>Data:</strong> ${servico.dataAgendamento}</p>
                <p><strong>Status:</strong> ${servico.concluido ? '✅ Concluído' : '⏳ Pendente'}</p>
            </div>
        `;
    });
    const { total, pendente, concluido } = calcularEstatisticasServicos();
    html += `<hr style="margin: 15px 0;">
             <div class="servico-item" style="border-bottom: none;">
                 <p><strong>Total Pendente:</strong> R$ ${pendente.toFixed(2)}</p>
                 <p><strong>Total Concluído:</strong> R$ ${concluido.toFixed(2)}</p>
                 <p style="font-weight:bold; font-size: 1.1rem; margin-top: 8px;">
                    <strong>Faturamento Total:</strong> R$ ${total.toFixed(2)}
                 </p>
             </div>
    `;
    html += `</div>`;
    resultadoEl.innerHTML = html;
}


// ==============================================
// 6. INICIALIZAÇÃO (Roteador de Páginas)
// (MODIFICADO)
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // --- PÁGINA DE LOGIN / HOME (index.html) ---
    if (path.includes('index.html') || path.endsWith('/')) {
        checkAuth('login');
        
        // --- Lógica do Modal de Login ---
        const modal = document.getElementById('modal-login');
        const openBtn = document.getElementById('btn-open-login');
        const heroBtn = document.getElementById('btn-hero-login');
        const closeBtn = document.querySelector('.close-modal-btn');
        const loginForm = document.getElementById('login-form-modal');

        const openModal = () => modal?.classList.add('active');
        const closeModal = () => modal?.classList.remove('active');

        openBtn?.addEventListener('click', openModal);
        heroBtn?.addEventListener('click', openModal);
        closeBtn?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = (document.getElementById('username') as HTMLInputElement).value;
            const pass = (document.getElementById('password') as HTMLInputElement).value;
            const errorEl = document.getElementById('login-error') as HTMLElement;

            if (login(user, pass)) {
                errorEl.style.display = 'none';
                window.location.href = isUserAdmin() ? 'admin.html' : 'cliente.html';
            } else {
                errorEl.style.display = 'block';
            }
        });

        // --- NOVA LÓGICA DO SLIDER (Request 2) ---
        // (A lógica do slider antigo foi removida)
        const heroSlides = document.querySelectorAll('.hero-slider .hero-slide');
        let currentHeroSlide = 0;
        
        function showHeroSlide(index: number) {
            heroSlides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        }
        
        function nextHeroSlide() {
            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
            showHeroSlide(currentHeroSlide);
        }

        if (heroSlides.length > 0) {
            showHeroSlide(currentHeroSlide);
            setInterval(nextHeroSlide, 4000); // Muda a cada 4 segundos
        }

    // --- PÁGINA DO CLIENTE (cliente.html) ---
    } else if (path.includes('cliente.html')) {
        // ... (código do cliente.html sem mudanças) ...
        checkAuth('client');
        const user = getLoggedInUser();
        (document.getElementById('welcome-message') as HTMLElement).textContent = `Bem-vindo(a), ${user}!`;
        document.getElementById('btn-logout')?.addEventListener('click', logout);
        document.getElementById('nav-cadastrar-animal')?.addEventListener('click', renderFormCadastrarAnimal);
        document.getElementById('nav-agendar-servico')?.addEventListener('click', renderFormAgendarServico);
        document.getElementById('nav-meus-animais')?.addEventListener('click', renderMeusAnimais);
        document.getElementById('nav-meus-servicos')?.addEventListener('click', renderMeusServicos);
        renderMeusAnimais(); 

    // --- PÁGINA DO ADMIN (admin.html) ---
    } else if (path.includes('admin.html')) {
        // ... (código do admin.html sem mudanças) ...
        checkAuth('admin');
        document.getElementById('btn-logout')?.addEventListener('click', logout);
        document.getElementById('nav-dashboard')?.addEventListener('click', () => {
            renderAdminDashboard();
            if(resultadoEl) resultadoEl.innerHTML = "<p>Dashboard atualizado. Clique nos contadores ou menu.</p>";
        });
        document.getElementById('nav-ver-animais')?.addEventListener('click', renderTodosAnimais);
        document.getElementById('nav-ver-servicos')?.addEventListener('click', renderTodosServicos);
        document.getElementById('counter-total-animais')?.addEventListener('click', renderTodosAnimais);
        document.getElementById('counter-total-servicos')?.addEventListener('click', renderTodosServicos);
        document.getElementById('counter-nao-vacinados')?.addEventListener('click', () => {
             if (!resultadoEl) return;
             const naoVacinados = getAnimaisNaoVacinados();
             let html = `<div class="animal-card erro-card"><h3>🚨 Animais Não Vacinados</h3>`;
             if (naoVacinados.length === 0) {
                 html += "<p>Todos os animais estão vacinados!</p>";
             } else {
                 naoVacinados.forEach(animal => {
                    html += `<div class="animal-item"><h4>${animal.nome} (Dono: ${animal.dono})</h4></div>`;
                 });
             }
             html += `</div>`;
             resultadoEl.innerHTML = html;
        });
        renderAdminDashboard();
    }
});