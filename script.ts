// ==============================================
// 1. INTERFACES
// Define a "forma" dos nossos objetos de dados.
// ==============================================

// Define a estrutura de um objeto Animal
interface Animal {
    id: number;           // Identificador único (ex: 1678886400000)
    nome: string;
    especie: string;
    idade: number;
    peso: number;
    vacinado: boolean;    // true ou false
    dono: string;         // Nome do usuário que cadastrou (ex: "usuario1")
}

// (MODIFICADO) Define a estrutura de um objeto Servico
interface Servico {
    id: number;
    tipo: 'banho' | 'consulta' | 'vacinação'; // Só aceita esses três valores
    animalId: number;     // ID do animal ao qual o serviço pertence
    preco: number;
    concluido: boolean;   // Se o serviço já foi pago/realizado
    dataAgendamento: string; // Data do serviço
    dono: string;         // Nome do usuário dono do serviço
    // NOVO: Campo para armazenar o método de pagamento
    metodoPagamento: 'cartao' | 'pix' | 'presencial' | null;
}

// ==============================================
// 2. "BANCO DE DADOS" (LocalStorage)
// Funções que leem e gravam no armazenamento do navegador.
// ==============================================

// Define as "chaves" que usaremos para salvar os dados no LocalStorage
const DB_ANIMALS = 'petshop_animais';
const DB_SERVICOS = 'petshop_servicos';

// Função para LER a lista de animais do LocalStorage
function getAnimais(): Animal[] {
    const data = localStorage.getItem(DB_ANIMALS); // Pega os dados da chave
    return data ? JSON.parse(data) : []; // Se houver dados, converte de texto (JSON) para objeto. Se não, retorna um array vazio.
}

// Função para SALVAR a lista de animais no LocalStorage
function saveAnimais(animais: Animal[]): void {
    // Converte o array de objetos para texto (JSON) e salva
    localStorage.setItem(DB_ANIMALS, JSON.stringify(animais));
}

// Função para LER a lista de serviços do LocalStorage
function getServicos(): Servico[] {
    const data = localStorage.getItem(DB_SERVICOS);
    return data ? JSON.parse(data) : [];
}

// Função para SALVAR a lista de serviços no LocalStorage
function saveServicos(servicos: Servico[]): void {
    localStorage.setItem(DB_SERVICOS, JSON.stringify(servicos));
}

// ==============================================
// 3. MÓDULO DE AUTENTICAÇÃO (SessionStorage)
// Controla quem está logado.
// ==============================================

// Define a chave para salvar o usuário logado no SessionStorage
// (SessionStorage é limpo quando o navegador fecha, LocalStorage não)
const AUTH_KEY = 'petshop_user';

/**
 * Tenta logar o usuário.
 * Retorna true se sucesso, false se falha.
 */
function login(username: string, pass: string): boolean {
    if (pass !== '1234') return false; // Senha padrão é '1234'

    const clientes = ['usuario1', 'usuario2', 'usuario3'];
    // Verifica se o usuário é um cliente válido OU o administrador
    if (clientes.includes(username) || username === 'administrador') {
        // Salva o nome de usuário na sessão para sabermos quem está logado
        sessionStorage.setItem(AUTH_KEY, username);
        return true;
    }
    return false; // Usuário não existe
}

/**
 * Desloga o usuário.
 */
function logout(): void {
    sessionStorage.removeItem(AUTH_KEY); // Remove o usuário da sessão
    window.location.href = 'index.html'; // Redireciona para a página de login
}

/**
 * Retorna o nome do usuário logado (ex: "usuario1") ou null se ninguém estiver logado.
 */
function getLoggedInUser(): string | null {
    return sessionStorage.getItem(AUTH_KEY);
}

/**
 * Verifica se o usuário logado é o administrador.
 */
function isUserAdmin(): boolean {
    return getLoggedInUser() === 'administrador';
}

/**
 * "Guardião de Página" - Verifica se o usuário pode estar na página atual.
 * Redireciona se necessário.
 */
function checkAuth(pageType: 'admin' | 'client' | 'login'): void {
    const user = getLoggedInUser(); // Pega o usuário logado

    // Se estivermos na PÁGINA DE LOGIN
    if (pageType === 'login') {
        if (user) { // Se já está logado...
            // Redireciona para o painel correto
            window.location.href = isUserAdmin() ? 'admin.html' : 'cliente.html';
        }
        return; // Se não está logado, pode ficar na página de login
    }

    // Se estivermos nas PÁGINAS DE PAINEL (cliente ou admin)
    if (!user) { // Se NÃO está logado...
        window.location.href = 'index.html'; // Expulsa para a página de login
        return;
    }

    // Se está logado, mas no painel errado...
    if (pageType === 'admin' && !isUserAdmin()) { // Cliente tentando ver /admin.html
        window.location.href = 'cliente.html'; // Redireciona
    }

    if (pageType === 'client' && isUserAdmin()) { // Admin tentando ver /cliente.html
        window.location.href = 'admin.html'; // Redireciona
    }
}

// ==============================================
// 4. LÓGICA DE NEGÓCIO (Funções Principais)
// Funções que fazem o "trabalho pesado".
// ==============================================

// --- Funções do Cliente ---

/**
 * Retorna APENAS os animais do usuário que está logado.
 */
function getMeusAnimais(): Animal[] {
    const user = getLoggedInUser();
    // Filtra a lista COMPLETA de animais, pegando só os que têm o 'dono' igual ao usuário logado
    return getAnimais().filter(animal => animal.dono === user);
}

/**
 * Retorna APENAS os serviços do usuário que está logado.
 */
function getMeusServicos(): Servico[] {
    const user = getLoggedInUser();
    return getServicos().filter(servico => servico.dono === user);
}

/**
 * Calcula o valor total dos serviços PENDENTES do usuário logado.
 */
function calcularTotalMeusServicos(): number {
    const user = getLoggedInUser();
    if (!user) return 0;
    
    // Filtra os serviços do usuário que AINDA NÃO foram concluídos
    const meusServicos = getServicos().filter(s => s.dono === user && !s.concluido);
    
    let total = 0;
    // Soma o preço de cada serviço pendente
    meusServicos.forEach(servico => {
        total += servico.preco;
    });
    return total;
}

/**
 * Cadastra um novo animal para o usuário logado.
 */
function cadastrarMeuAnimal(nome: string, especie: string, anoNascimento: number, peso: number, vacinado: boolean): string {
    const user = getLoggedInUser();
    if (!user) return "Erro: Usuário não logado.";

    const todosAnimais = getAnimais(); // Pega a lista completa
    const idade = new Date().getFullYear() - anoNascimento; // Calcula a idade

    // Cria o novo objeto Animal
    const novoAnimal: Animal = {
        id: Date.now(), // ID único baseado no timestamp atual
        nome,
        especie,
        idade,
        peso,
        vacinado: vacinado, // Usa o valor vindo do formulário
        dono: user          // Atribui o animal ao usuário logado
    };

    todosAnimais.push(novoAnimal); // Adiciona o novo animal à lista
    saveAnimais(todosAnimais);     // Salva a lista atualizada no LocalStorage
    return `✅ Animal "${nome}" cadastrado com sucesso!`; // Mensagem de sucesso
}

/**
 * (MODIFICADO) Agenda um novo serviço para um animal do usuário logado.
 */
function agendarMeuServico(animalId: number, tipo: Servico['tipo'], data: string): string {
    const user = getLoggedInUser();
    // Procura o animal na lista DESTE usuário
    const animal = getMeusAnimais().find(a => a.id === animalId);

    if (!user) return "Erro: Usuário não logado.";
    if (!animal) return "❌ Erro: Animal não encontrado ou não pertence a você.";

    // Define os preços
    const precos = { 'banho': 50.00, 'consulta': 100.00, 'vacinação': 80.00 };
    const todosServicos = getServicos();
    
    // Cria o novo objeto Servico
    const novoServico: Servico = {
        id: Date.now(),
        animalId: animalId,
        tipo: tipo,
        preco: precos[tipo], // Pega o preço baseado no tipo
        concluido: false,    // Começa como pendente
        dataAgendamento: data,
        dono: user,
        metodoPagamento: null // NOVO: Inicia como não pago
    };

    todosServicos.push(novoServico); // Adiciona o serviço à lista
    saveServicos(todosServicos);     // Salva a lista atualizada
    return `✅ Serviço de ${tipo} agendado para ${animal.nome} em ${data}!`;
}

// --- Funções do Admin ---

/**
 * Retorna TODOS os animais que NÃO estão vacinados (de todos os usuários).
 */
function getAnimaisNaoVacinados(): Animal[] {
    return getAnimais().filter(animal => !animal.vacinado);
}

/**
 * Calcula estatísticas financeiras de TODOS os serviços.
 */
function calcularEstatisticasServicos(): { total: number, pendente: number, concluido: number } {
    const todosServicos = getServicos();
    let total = 0;
    let pendente = 0;
    let concluido = 0;

    todosServicos.forEach(servico => {
        total += servico.preco; // Soma todos
        if (servico.concluido) {
            concluido += servico.preco; // Soma os concluídos
        } else {
            pendente += servico.preco; // Soma os pendentes
        }
    });
    return { total, pendente, concluido }; // Retorna um objeto com os 3 valores
}

/**
 * Marca um animal específico como vacinado.
 */
function marcarComoVacinado(animalId: number): string {
    const todosAnimais = getAnimais();
    // Encontra o índice (posição) do animal na lista
    const animalIndex = todosAnimais.findIndex(a => a.id === animalId);
    
    if (animalIndex > -1) { // Se encontrou (índice é 0 ou maior)
        todosAnimais[animalIndex].vacinado = true; // Altera o status
        saveAnimais(todosAnimais); // Salva a lista modificada
        return `✅ ${todosAnimais[animalIndex].nome} marcado como vacinado!`;
    }
    return "❌ Animal não encontrado!";
}

/**
 * NOVO: Marca um serviço específico como concluído.
 */
function marcarServicoConcluido(servicoId: number): string {
    const todosServicos = getServicos();
    const servicoIndex = todosServicos.findIndex(s => s.id === servicoId);

    if (servicoIndex > -1) {
        todosServicos[servicoIndex].concluido = true;
        saveServicos(todosServicos);
        return `✅ Serviço (ID: ${servicoId}) marcado como concluído!`;
    }
    return "❌ Serviço não encontrado!";
}

/**
 * NOVO: Registra o método de pagamento para um serviço.
 */
function registrarPagamento(servicoId: number, metodo: 'cartao' | 'pix' | 'presencial'): string {
    const todosServicos = getServicos();
    const servicoIndex = todosServicos.findIndex(s => s.id === servicoId);

    if (servicoIndex > -1) {
        todosServicos[servicoIndex].metodoPagamento = metodo;
        saveServicos(todosServicos);
        return `✅ Pagamento via ${metodo} registrado!`;
    }
    return "❌ Serviço não encontrado!";
}


// ==============================================
// 5. RENDERIZAÇÃO (Funções que desenham na tela)
// Funções que criam HTML e o injetam na página.
// ==============================================

// Pega o elemento principal onde todo o conteúdo dinâmico será mostrado
const resultadoEl = document.getElementById('resultado');

// --- Funções de Renderização (Cliente) ---

/**
 * Desenha o formulário de CADASTRAR ANIMAL na tela.
 */
function renderFormCadastrarAnimal(): void {
    if (!resultadoEl) return; // Se a área de resultado não existir, para a função
    
    // Define o HTML do formulário
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
    
    // ADICIONA O "OUVINTE" DE EVENTO: O que fazer quando o formulário for enviado?
    document.getElementById('form-cadastrar-animal')?.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o recarregamento padrão da página
        
        // Pega os valores dos campos do formulário
        const nome = (document.getElementById('animal-nome') as HTMLInputElement).value;
        const especie = (document.getElementById('animal-especie') as HTMLInputElement).value;
        const ano = parseInt((document.getElementById('animal-ano') as HTMLInputElement).value);
        const peso = parseFloat((document.getElementById('animal-peso') as HTMLInputElement).value);
        const vacinado = (document.getElementById('animal-vacinado') as HTMLSelectElement).value === 'true'; // Converte "true" (texto) para true (booleano)
        
        // Chama a função da lógica de negócio
        const msg = cadastrarMeuAnimal(nome, especie, ano, peso, vacinado);
        
        alert(msg); // Mostra a mensagem de confirmação
        renderMeusAnimais(); // Atualiza a lista de animais na tela
    });
}

/**
 * Desenha o formulário de AGENDAR SERVIÇO na tela.
 */
function renderFormAgendarServico(): void {
    if (!resultadoEl) return;
    const meusAnimais = getMeusAnimais(); // Pega os animais do usuário

    // Se o usuário não tem animais, mostra um erro
    if (meusAnimais.length === 0) {
        resultadoEl.innerHTML = `
            <div class="erro-card">
                <h3>❌ Nenhum animal cadastrado</h3>
                <p>Você precisa cadastrar um animal antes de agendar um serviço.</p>
                <button id="btn-ir-cadastro">Cadastrar Animal Agora</button>
            </div>
        `;
        // Adiciona um listener no botão para levar ao formulário de cadastro
        document.getElementById('btn-ir-cadastro')?.addEventListener('click', renderFormCadastrarAnimal);
        return;
    }

    // Se tem animais, cria as opções (<option>) do <select> dinamicamente
    const opcoesAnimais = meusAnimais.map(animal => 
        `<option value="${animal.id}">${animal.nome} (${animal.especie})</option>`
    ).join(''); // Junta todas as strings <option>

    // Define o HTML do formulário
    resultadoEl.innerHTML = `
        <div class="form-card">
            <h3>📅 Agendar Serviço</h3>
            <form id="form-agendar-servico">
                <div class="form-group">
                    <label for="servico-animal">Selecione o Animal</label>
                    <select id="servico-animal" required>
                        ${opcoesAnimais} </select>
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
                    <input type="date" id="servico-data" required min="${new Date().toISOString().split('T')[0]}"> </div>
                <button type="submit">Agendar</button>
            </form>
        </div>
    `;
    
    // ADICIONA O "OUVINTE" DE EVENTO:
    document.getElementById('form-agendar-servico')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Pega os valores dos campos
        const animalId = parseInt((document.getElementById('servico-animal') as HTMLSelectElement).value);
        const tipo = (document.getElementById('servico-tipo') as HTMLSelectElement).value as Servico['tipo'];
        const data = (document.getElementById('servico-data') as HTMLInputElement).value;
        
        // Chama a lógica de negócio
        const msg = agendarMeuServico(animalId, tipo, data);
        
        // Calcula o total de serviços PENDENTES
        const total = calcularTotalMeusServicos();
        // Mostra a mensagem de sucesso + o valor total
        alert(`${msg}\n\n💸 Valor total dos seus agendamentos: R$ ${total.toFixed(2)}`);
        
        renderMeusServicos(); // Atualiza a lista de serviços na tela
    });
}

/**
 * Desenha a lista de "Meus Animais" do usuário na tela.
 */
function renderMeusAnimais(): void {
    if (!resultadoEl) return;
    const meusAnimais = getMeusAnimais();
    
    if (meusAnimais.length === 0) {
        resultadoEl.innerHTML = `<div class="animal-card"><p>Nenhum animal cadastrado ainda.</p></div>`;
        return;
    }

    // Começa a construir o HTML
    let html = `<div class="animal-card"><h3>📝 Meus Animais Cadastrados</h3>`;
    // Loop (forEach) por cada animal e adiciona seu HTML
    meusAnimais.forEach(animal => {
        html += `
            <div class="animal-item">
                <h4>${animal.nome} (${animal.especie})</h4>
                <p><strong>Idade:</strong> ${animal.idade} anos | <strong>Peso:</strong> ${animal.peso} kg</p>
                <p><strong>Vacinado:</strong> ${animal.vacinado ? '✅ Sim' : '❌ Não'}</p> </div>
        `;
    });
    html += `<p><strong>Total:</strong> ${meusAnimais.length} animais</p></div>`;
    resultadoEl.innerHTML = html; // Injeta o HTML final na tela
}

/**
 * (MODIFICADO) Desenha a lista de "Meus Agendamentos" com lógica de pagamento.
 */
function renderMeusServicos(): void {
    if (!resultadoEl) return;
    const meusServicos = getMeusServicos();
    const meusAnimais = getMeusAnimais(); // Pega os animais para saber o nome

    if (meusServicos.length === 0) {
        resultadoEl.innerHTML = `<div class="animal-card"><p>Nenhum serviço agendado.</p></div>`;
        return;
    }

    let html = `<div class="animal-card"><h3>📋 Meus Agendamentos</h3>`;
    meusServicos.forEach(servico => {
        // Encontra o nome do animal correspondente ao ID do serviço
        const animal = meusAnimais.find(a => a.id === servico.animalId);
        const animalNome = animal ? animal.nome : "Animal Removido";
        
        // --- Lógica de Status e Pagamento ---
        let statusHtml = '';
        let pickupHtml = '';
        let paymentHtml = '';

        if (!servico.concluido) {
            // Cenário 1: Serviço PENDENTE
            statusHtml = `<p><strong>Status:</strong> ⏳ Pendente</p>`;
        } else if (servico.concluido && !servico.metodoPagamento) {
            // Cenário 2: Concluído, AGUARDANDO PAGAMENTO
            statusHtml = `<p><strong>Status:</strong> ✅ Concluído. Pagamento pendente.</p>`;
            pickupHtml = `<p class="pickup-message">🎉 Seu pet está pronto para ser buscado!</p>`;
            // Adiciona os botões de pagamento
            paymentHtml = `
                <div class="payment-options">
                    <button class="btn-pagamento pix" onclick="handlePagarServico(${servico.id}, 'pix')">Pagar com PIX</button>
                    <button class="btn-pagamento" onclick="handlePagarServico(${servico.id}, 'cartao')">Pagar com Cartão</button>
                    <button class="btn-pagamento presencial" onclick="handlePagarServico(${servico.id}, 'presencial')">Pagar na Recepção</button>
                </div>
            `;
        } else {
            // Cenário 3: Concluído e PAGO
            statusHtml = `<p><strong>Status:</strong> ✅ Concluído e Pago (${servico.metodoPagamento})</p>`;
            // Se já pagou, presumimos que já pode buscar ou já buscou
            pickupHtml = `<p class="pickup-message">🎉 Serviço finalizado!</p>`;
        }
        // --- Fim da Lógica ---

        // Monta o HTML do item
        html += `
            <div class="servico-item">
                <h4>${servico.tipo.charAt(0).toUpperCase() + servico.tipo.slice(1)} - R$ ${servico.preco.toFixed(2)}</h4>
                <p><strong>Animal:</strong> ${animalNome}</p>
                <p><strong>Data:</strong> ${servico.dataAgendamento}</p>
                ${statusHtml} ${pickupHtml} ${paymentHtml} </div>
        `;
    });
    
    // Adiciona o valor total (APENAS DE SERVIÇOS PENDENTES) no final
    const total = calcularTotalMeusServicos();
    if (total > 0) { // Só mostra o total se houver serviços pendentes
        html += `<hr style="margin: 15px 0;">
                 <p style="font-weight:bold; font-size: 1.1rem;">
                    <strong>Valor Total (Pendentes):</strong> R$ ${total.toFixed(2)}
                 </p>
        `;
    }
    
    html += `</div>`;
    resultadoEl.innerHTML = html;
}

// --- Funções de Renderização (Admin) ---

/**
 * (MODIFICADO) Atualiza os números nos 5 cards do dashboard do Admin.
 */
function renderAdminDashboard(): void {
    // Pega todos os serviços
    const todosServicos = getServicos();
    // Filtra para saber quantos estão pendentes
    const servicosPendentes = todosServicos.filter(s => !s.concluido).length;
    // Filtra para saber quantos estão concluídos
    const servicosConcluidos = todosServicos.filter(s => s.concluido).length;
    
    const totalAnimais = getAnimais().length;
    const naoVacinados = getAnimaisNaoVacinados().length;
    // Pega o faturamento total (de todos os serviços, pendentes ou não)
    const { total } = calcularEstatisticasServicos(); 
    
    // Atualiza o texto de cada card
    (document.getElementById('total-animais-num') as HTMLElement).textContent = String(totalAnimais);
    (document.getElementById('pendentes-servicos-num') as HTMLElement).textContent = String(servicosPendentes); // Card de pendentes
    (document.getElementById('concluidos-servicos-num') as HTMLElement).textContent = String(servicosConcluidos); // Card de concluídos
    (document.getElementById('nao-vacinados-num') as HTMLElement).textContent = String(naoVacinados);
    (document.getElementById('faturamento-total-num') as HTMLElement).textContent = total.toFixed(2);
}

/**
 * Desenha a lista de TODOS os animais do sistema (para o Admin).
 */
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

/**
 * Função Global para o 'onclick' do botão de vacinar.
 */
(window as any).handleVacinar = (animalId: number) => {
    const msg = marcarComoVacinado(animalId);
    alert(msg);
    renderTodosAnimais(); // Re-desenha a lista de animais
    renderAdminDashboard(); // Atualiza os contadores
};

/**
 * (MODIFICADO) Desenha a lista de TODOS os serviços com botão de "Concluir".
 */
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
        
        // Define o status
        let statusTexto = '';
        if (servico.concluido && servico.metodoPagamento) {
            statusTexto = `✅ Concluído e Pago (${servico.metodoPagamento})`;
        } else if (servico.concluido && !servico.metodoPagamento) {
            statusTexto = '✅ Concluído (Aguardando Pagto.)';
        } else {
            statusTexto = '⏳ Pendente';
        }
        
        html += `
            <div class="servico-item">
                <h4>${servico.tipo} - R$ ${servico.preco.toFixed(2)} (Dono: ${servico.dono})</h4>
                <p><strong>Animal:</strong> ${animalNome}</p>
                <p><strong>Data:</strong> ${servico.dataAgendamento}</p>
                <p><strong>Status:</strong> ${statusTexto}</p>
                
                <button class="${servico.concluido ? 'btn-concluido' : ''}" onclick="handleConcluirServico(${servico.id})" ${servico.concluido ? 'disabled' : ''}>
                    ${servico.concluido ? '✅ Concluído' : '⏳ Marcar Concluído'}
                </button>
            </div>
        `;
    });
    
    // Adiciona o sumário financeiro TOTAL no final da lista
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

/**
 * NOVO: Função Global para o 'onclick' do botão de CONCLUIR SERVIÇO.
 */
(window as any).handleConcluirServico = (servicoId: number) => {
    const msg = marcarServicoConcluido(servicoId);
    alert(msg);
    renderTodosServicos(); // Re-desenha a lista de serviços
    renderAdminDashboard(); // Atualiza os contadores
};

/**
 * NOVO: Função Global para o 'onclick' dos botões de PAGAMENTO.
 */
(window as any).handlePagarServico = (servicoId: number, metodo: 'cartao' | 'pix' | 'presencial') => {
    // Simula o pagamento
    if (metodo === 'pix') {
        alert("Pagamento via PIX registrado!\n\n(Simulação) Código PIX: 1234-5678-ABCD-EFGH");
    } else if (metodo === 'cartao') {
        alert("Pagamento via Cartão registrado com sucesso!\n\n(Simulação)");
    } else {
        alert("Pagamento presencial selecionado.\n\nPor favor, pague na recepção ao buscar seu pet.");
    }
    
    // Registra o pagamento no "banco de dados"
    registrarPagamento(servicoId, metodo);
    
    // Re-desenha a lista de serviços do cliente (para esconder os botões)
    renderMeusServicos();
};


// ==============================================
// 6. INICIALIZAÇÃO (Roteador de Páginas)
// O que acontece assim que a página é carregada.
// ==============================================

// Espera o HTML ser todo carregado para executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Pega o caminho da URL (ex: "/cliente.html")
    const path = window.location.pathname;

    // --- LÓGICA DA PÁGINA DE LOGIN / HOME (index.html) ---
    if (path.includes('index.html') || path.endsWith('/')) {
        checkAuth('login'); // Verifica se o usuário já está logado
        
        // --- Lógica do Modal de Login ---
        const modal = document.getElementById('modal-login');
        const openBtn = document.getElementById('btn-open-login'); // Botão na navbar
        const heroBtn = document.getElementById('btn-hero-login'); // Botão no hero
        const closeBtn = document.querySelector('.close-modal-btn'); // Botão 'X'
        const loginForm = document.getElementById('login-form-modal');

        const openModal = () => modal?.classList.add('active'); // Função para mostrar o modal
        const closeModal = () => modal?.classList.remove('active'); // Função para esconder o modal

        // Adiciona os "ouvintes" de clique
        openBtn?.addEventListener('click', openModal);
        heroBtn?.addEventListener('click', openModal);
        closeBtn?.addEventListener('click', closeModal);
        // Fecha o modal se clicar fora da caixa branca (no fundo escuro)
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // "Ouvinte" para o envio do formulário de login
        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = (document.getElementById('username') as HTMLInputElement).value;
            const pass = (document.getElementById('password') as HTMLInputElement).value;
            const errorEl = document.getElementById('login-error') as HTMLElement;

            if (login(user, pass)) { // Se o login for sucesso...
                errorEl.style.display = 'none'; // Esconde o erro
                window.location.href = isUserAdmin() ? 'admin.html' : 'cliente.html'; // Redireciona
            } else {
                errorEl.style.display = 'block'; // Mostra o erro
            }
        });

        // --- Lógica do Slider do Hero ---
        const heroSlides = document.querySelectorAll('.hero-slider .hero-slide');
        let currentHeroSlide = 0;
        
        // Função que mostra um slide específico e esconde os outros
        function showHeroSlide(index: number) {
            heroSlides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index); // Adiciona 'active' se o índice for igual, remove se for diferente
            });
        }
        
        // Função que avança para o próximo slide
        function nextHeroSlide() {
            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length; // (0 -> 1 -> 2 -> 0)
            showHeroSlide(currentHeroSlide);
        }

        if (heroSlides.length > 0) {
            showHeroSlide(currentHeroSlide); // Mostra o primeiro slide
            setInterval(nextHeroSlide, 5000); // Troca de slide a cada 5 segundos (5000 ms)
        }

    // --- LÓGICA DA PÁGINA DO CLIENTE (cliente.html) ---
    } else if (path.includes('cliente.html')) {
        checkAuth('client'); // Protege a página
        const user = getLoggedInUser();
        // Define a mensagem de boas-vindas
        (document.getElementById('welcome-message') as HTMLElement).textContent = `Bem-vindo(a), ${user}!`;
        
        // Adiciona os "ouvintes" de clique para os links da navbar
        document.getElementById('btn-logout')?.addEventListener('click', logout);
        document.getElementById('nav-cadastrar-animal')?.addEventListener('click', renderFormCadastrarAnimal);
        document.getElementById('nav-agendar-servico')?.addEventListener('click', renderFormAgendarServico);
        document.getElementById('nav-meus-animais')?.addEventListener('click', renderMeusAnimais);
        document.getElementById('nav-meus-servicos')?.addEventListener('click', renderMeusServicos);

        renderMeusAnimais(); // Mostra a lista de "Meus Animais" por padrão

    // --- LÓGICA DA PÁGINA DO ADMIN (admin.html) ---
    } else if (path.includes('admin.html')) {
        checkAuth('admin'); // Protege a página
        
        // Adiciona os "ouvintes" de clique para os links da navbar
        document.getElementById('btn-logout')?.addEventListener('click', logout);
        document.getElementById('nav-dashboard')?.addEventListener('click', () => {
            renderAdminDashboard(); // Atualiza os contadores
            if(resultadoEl) resultadoEl.innerHTML = "<p>Dashboard atualizado. Clique nos contadores ou menu.</p>";
        });
        document.getElementById('nav-ver-animais')?.addEventListener('click', renderTodosAnimais);
        document.getElementById('nav-ver-servicos')?.addEventListener('click', renderTodosServicos);
        
        // (MODIFICADO) Adiciona os "ouvintes" para os CARDS clicáveis
        document.getElementById('counter-total-animais')?.addEventListener('click', renderTodosAnimais);
        
        // NOVO: O card de "serviços pendentes"
        document.getElementById('counter-pendentes-servicos')?.addEventListener('click', () => {
            // No futuro, isso poderia filtrar para mostrar apenas os pendentes
            renderTodosServicos(); 
        });
        
        // NOVO: O card de "serviços concluídos"
        document.getElementById('counter-concluidos-servicos')?.addEventListener('click', () => {
            // No futuro, isso poderia filtrar para mostrar apenas os concluídos
            renderTodosServicos(); 
        });
        
        // O card de "não vacinados"
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

        renderAdminDashboard(); // Mostra os contadores por padrão
    }
});