class Produto {
  #preco;
  #quantidade;

  constructor(nome, preco, quantidade) {
    if (!nome || preco <= 0 || quantidade <= 0) {
      throw new Error("Dados inválidos para o produto.");
    }
    this.nome = nome;
    this.#preco = parseFloat(preco);
    this.#quantidade = parseInt(quantidade, 10);
  }

  get preco() {
    return this.#preco;
  }

  get quantidade() {
    return this.#quantidade;
  }

  valorTotal() {
    return this.#preco * this.#quantidade;
  }

  toJSON() {
    return {
      nome: this.nome,
      preco: this.#preco,
      quantidade: this.#quantidade
    };
  }
}

// CONFIGURAÇÃO API
const API_BASE = "https://api-produtos-express-brown.vercel.app";
const API_URL = `${API_BASE}/produtos`;

// FUNÇÃO QUE PEGA O CRACHÁ
function getHeaders(){
  const token = localStorage.getItem('token');
  const headers = { "Content-Type": "application/json" };
  if(token){
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Se não tem token, manda pro login quando tentar ação de admin
function verificarLogin(){
  const token = localStorage.getItem('token');
  const perfil = localStorage.getItem('perfil');
  if(!token){
    alert("Você precisa fazer login como admin!");
    window.location.href = "login.html";
    return false;
  }
  if(perfil !== 'admin'){
    alert("Só admin pode cadastrar/apagar! Sua conta é de cliente");
    return false;
  }
  return true;
}

// REQUISIÇÃO POST - Agora com token
document.getElementById("produto-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  if(!verificarLogin()) return;

  const nome = document.getElementById("nome").value;
  const preco = document.getElementById("preco").value;
  const quantidade = document.getElementById("quantidade").value;

  try {
    const novoProduto = new Produto(nome, preco, quantidade);

    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(novoProduto.toJSON())
    });

    if (resposta.status === 401 || resposta.status === 403) {
      const erro = await resposta.json();
      alert(erro.erro + " - Faça login de novo!");
      window.location.href = "login.html";
      return;
    }

    if (!resposta.ok) {
      throw new Error("Erro ao salvar o produto no servidor backend.");
    }

    renderizarTabela();
    e.target.reset();
  } catch (erro) {
    alert(erro.message);
  }
});

// REQUISIÇÃO GET - Continua pública, qualquer um vê batata e torresmo
async function renderizarTabela() {
  try {
    const resposta = await fetch(API_URL);
    const dadosBrutosDoServidor = await resposta.json();

    const tabela = document.querySelector("#tabela-produtos tbody");
    tabela.innerHTML = "";

    let totalAcumulado = 0;

    dadosBrutosDoServidor.forEach((dados) => {
      const produto = new Produto(dados.nome, dados.preco, dados.quantidade);
      totalAcumulado += produto.valorTotal();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><button class="btn-excluir" onclick="deletarProdutoUnico('${dados.id}')">X</button></td>
        <td>${produto.nome}</td>
        <td>R$ ${produto.preco.toFixed(2)}</td>
        <td>${produto.quantidade}</td>
        <td>R$ ${produto.valorTotal().toFixed(2)}</td>
      `;
      tabela.appendChild(row);
    });

    document.getElementById("total-estoque").textContent = `Total em estoque: R$ ${totalAcumulado.toFixed(2)}`;
  } catch (erro) {
    console.error("Erro ao buscar dados no servidor:", erro);
  }
}

// REQUISIÇÃO DELETE (Em lote) - Agora com token
document.getElementById("limpar-tabela").addEventListener("click", async function () {
  if(!verificarLogin()) return;
  if (confirm("Deseja mesmo limpar toda a tabela no servidor?")) {
    try {
      const res = await fetch(API_URL, { method: "DELETE", headers: getHeaders() });
      if (res.status === 401 || res.status === 403) {
        alert("Sem permissão! Faça login como admin");
        window.location.href = "login.html";
        return;
      }
      renderizarTabela();
    } catch (erro) {
      console.error("Erro ao limpar dados no servidor:", erro);
    }
  }
});

// EXCLUIR UM ÚNICO PRODUTO - Agora com token
async function deletarProdutoUnico(id) {
  if(!verificarLogin()) return;
  if (confirm("Deseja excluir apenas este produto?")) {
    try {
      const resposta = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: getHeaders()
      });

      if (resposta.status === 401 || resposta.status === 403) {
        const erro = await resposta.json();
        alert(erro.erro);
        window.location.href = "login.html";
        return;
      }

      if (!resposta.ok) {
        throw new Error("Erro ao apagar o produto no servidor.");
      }

      renderizarTabela();
    } catch (erro) {
      alert(erro.message);
    }
  }
}

// MOSTRAR QUEM TÁ LOGADO
window.addEventListener('DOMContentLoaded', ()=>{
  const nome = localStorage.getItem('nome');
  const perfil = localStorage.getItem('perfil');
  if(nome){
    const info = document.createElement('div');
    info.innerHTML = `<p style="text-align:center">Logado como: <b>${nome}</b> (${perfil}) <button onclick="logout()" style="margin-left:10px">Sair</button></p>`;
    document.body.prepend(info);
  }
});

function logout(){
  localStorage.clear();
  window.location.href = 'login.html';
}

// INICIALIZAÇÃO AUTOMÁTICA
renderizarTabela();
