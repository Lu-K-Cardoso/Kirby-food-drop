// Kirby Food Drop

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const LARGURA = canvas.width;
const ALTURA = canvas.height;

// ---------- Estado do jogo ----------
let estado = 'titulo';   // 'titulo', 'modos', 'jogando' ou 'fim' (game over)
let modo = 0;            // 0 = Fácil, 1 = Médio, 2 = Difícil
let pontos = 0;
let vidas = 3;
let recorde = Number(localStorage.getItem('kirbyRecorde')) || 0; // fica salvo no navegador

// ---------- Modos de jogo (cada um ocupa uma coluna da tela de seleção) ----------
const MODOS = [
  { nome: 'Fácil', desc: ['Só cai', 'comida e', 'bomba'] },
  { nome: 'Médio', desc: ['Comida,', 'bombas,', 'escudo e', 'inimigos'] },
  { nome: 'Difícil', desc: ['Só bombas', 'e uma comida', 'por vez'] }
];
const LARGURA_COLUNA = LARGURA / 3;
const BOTAO_JOGAR = { x: LARGURA / 2 - 110, y: 400, w: 220, h: 70 };

// ---------- Kirby e teclado ----------
const kirby = { x: LARGURA / 2, y: ALTURA - 62, raio: 34, vx: 0 };
const teclas = {};

// ---------- Itens que caem ----------
const COMIDAS = ['🍎', '🍰', '🍉', '🍓', '🍩', '🍔'];
let itens = [];
let tempoNovoItem = 1;

// ---------- Entrada ----------
addEventListener('keydown', (e) => {
  if (e.key.startsWith('Arrow')) e.preventDefault();
  teclas[e.key.toLowerCase()] = true;

  if (estado === 'titulo' && e.key === 'Enter') {
    estado = 'modos';
  } else if (estado === 'modos') {
  if (['1', '2', '3'].includes(e.key)) iniciarJogo(Number(e.key) - 1);
  if (e.key === 'Escape') estado = 'titulo';
  } else if (estado === 'fim') {
  if (e.key === 'Enter') iniciarJogo();
  if (e.key.toLowerCase() === 'm') estado = 'titulo';
  }
});

addEventListener('keyup', (e) => {
  teclas[e.key.toLowerCase()] = false;
});

// Converte o clique (pixels da tela) para as coordenadas do canvas
function posicaoDoMouse(e) {
  const caixa = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - caixa.left) * LARGURA / caixa.width,
    y: (e.clientY - caixa.top) * ALTURA / caixa.height
  };
}

canvas.addEventListener('click', (e) => {
  const mouse = posicaoDoMouse(e);
  if (estado === 'titulo') {
    const b = BOTAO_JOGAR;
    if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) estado = 'modos';
  } else if (estado === 'modos') {
    iniciarJogo(Math.min(2, Math.floor(mouse.x / LARGURA_COLUNA))); // 0, 1 ou 2 conforme a coluna
  } else if (estado === 'fim') {
    iniciarJogo();
  }
});

// ---------- Controle do jogo ----------
function iniciarJogo(novoModo) {
  if (novoModo !== undefined) modo = novoModo; // sem argumento = repete o mesmo modo
  kirby.x = LARGURA / 2;
  kirby.vx = 0;
  itens = [];
  pontos = 0;
  vidas = 3;
  tempoNovoItem = 1;
  estado = 'jogando';
}

function terminarJogo() {
  estado = 'fim';
  if (pontos > recorde) {
    recorde = pontos;
    localStorage.setItem('kirbyRecorde', recorde);
  }
}

// ---------- Lógica ----------
function moverKirby(dt) {
  let direcao = 0;
  if (teclas['arrowright'] || teclas['d']) direcao += 1;
  if (teclas['arrowleft'] || teclas['a']) direcao -= 1;

  kirby.vx = direcao * 380;
  kirby.x += kirby.vx * dt;
  kirby.x = Math.max(kirby.raio, Math.min(LARGURA - kirby.raio, kirby.x));
}

function criarItem() {
  const ehBomba = Math.random() < 0.22;
  itens.push({
    x: 30 + Math.random() * (LARGURA - 60),
    y: -30,
    vy: 130 + Math.random() * 80,
    raio: 20,
    tipo: ehBomba ? 'bomba' : 'comida',
    emoji: ehBomba ? '💣' : COMIDAS[Math.floor(Math.random() * COMIDAS.length)]
  });
}

function atualizarItens(dt) {
  tempoNovoItem -= dt;
  if (tempoNovoItem <= 0) {
    criarItem();
    tempoNovoItem = 1;
  }

  for (const item of itens) {
    item.y += item.vy * dt;

    // colisão círculo com círculo: distância entre os centros < soma dos raios
    const distancia = Math.hypot(kirby.x - item.x, kirby.y - item.y);
    if (distancia < kirby.raio + item.raio - 8) {
      item.morto = true;
      if (item.tipo === 'comida') pontos += 10;
      else vidas--;
    }

    if (item.y > ALTURA + 30) item.morto = true;
  }
  itens = itens.filter((item) => !item.morto);

  if (vidas <= 0) terminarJogo();
}

// ---------- Desenho ----------
function desenharItens() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '38px sans-serif';
  for (const item of itens) ctx.fillText(item.emoji, item.x, item.y);
}

function desenharPlacar() {
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#2b2d6e';
  ctx.font = '700 22px sans-serif';

  ctx.textAlign = 'left';
  ctx.fillText('Pontos ' + pontos, 14, 30);

  ctx.textAlign = 'right';
  ctx.fillText('❤️'.repeat(Math.max(0, vidas)), LARGURA - 14, 30);
}

// Camada escura por cima do jogo, usada no menu e no game over
function desenharCamada(titulo, linhas) {
  ctx.fillStyle = 'rgba(43, 45, 110, 0.55)';
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = '700 44px sans-serif';
  ctx.fillText(titulo, LARGURA / 2, 220);

  ctx.font = '600 18px sans-serif';
  linhas.forEach((linha, i) => ctx.fillText(linha, LARGURA / 2, 270 + i * 28));
}

function desenharTelas() {
  if (estado === 'fim') {
    desenharCamada('Game Over', [
      'Pontos: ' + pontos + '   Recorde: ' + recorde,
      'Enter ou clique: jogar de novo',
      'M: voltar ao início'
    ]);
  }
}

const FONTE_TITULO = '"Arial Black", Impact, sans-serif';

// Fundo quadriculado (estilo arcade). O "deslocamento" faz o xadrez andar na diagonal.
function desenharXadrez(x, y, w, h, cor1, cor2, tamanho, deslocamento) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip(); // só desenha dentro da área
  const colunas = Math.ceil(w / tamanho) + 2;
  const linhas = Math.ceil(h / tamanho) + 2;
  for (let linha = -1; linha < linhas; linha++) {
    for (let coluna = -1; coluna < colunas; coluna++) {
      ctx.fillStyle = (linha + coluna) % 2 === 0 ? cor1 : cor2;
      ctx.fillRect(x + coluna * tamanho + deslocamento, y + linha * tamanho + deslocamento, tamanho, tamanho);
    }
  }
  ctx.restore();
}

// Texto grande com sombra; se não couber na tela, diminui a fonte
function textoComSombra(texto, x, y, tamanho, cor) {
  ctx.font = '900 ' + tamanho + 'px ' + FONTE_TITULO;
  while (ctx.measureText(texto).width > LARGURA - 40 && tamanho > 20) {
    tamanho -= 2;
    ctx.font = '900 ' + tamanho + 'px ' + FONTE_TITULO;
  }
  ctx.fillStyle = '#12143a';
  ctx.fillText(texto, x + 6, y + 6);
  ctx.fillStyle = cor;
  ctx.fillText(texto, x, y);
}

function desenharTitulo() {
  desenharXadrez(0, 0, LARGURA, ALTURA, '#2b2d6e', '#363a85', 40, (tempoAnterior / 40) % 40);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  textoComSombra('KIRBY', LARGURA / 2, 190, 110, '#ffaed0');
  textoComSombra('FOOD DROP', LARGURA / 2, 290, 62, '#ffe27a');

  // botão de play que pulsa de leve
  const b = BOTAO_JOGAR;
  const pulso = 1 + Math.sin(tempoAnterior / 250) * 0.04;
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
  ctx.scale(pulso, pulso);
  ctx.fillStyle = '#12143a';
  ctx.beginPath();
  ctx.roundRect(-b.w / 2 + 5, -b.h / 2 + 6, b.w, b.h, 16); // sombra
  ctx.fill();
  ctx.fillStyle = '#6fcf6b';
  ctx.beginPath();
  ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 16);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '900 34px ' + FONTE_TITULO;
  ctx.fillText('▶ JOGAR', 0, 2);
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = '600 16px sans-serif';
  ctx.fillText('ou aperte Enter', LARGURA / 2, b.y + b.h + 40);
}

function desenharModos() {
  const cores = ['#8fd3ff', '#9a9a9a', '#c0392b'];
  MODOS.forEach((m, i) => {
    const x = i * LARGURA_COLUNA;
    ctx.fillStyle = cores[i];
    ctx.fillRect(x, 0, LARGURA_COLUNA, ALTURA);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 28px sans-serif';
    ctx.fillText(m.nome, x + LARGURA_COLUNA / 2, ALTURA / 2 - 30);
    ctx.font = '600 15px sans-serif';
    m.desc.forEach((linha, j) => ctx.fillText(linha, x + LARGURA_COLUNA / 2, ALTURA / 2 + 5 + j * 20));
  });
}

function desenhar() {
  // título e seleção de modos ocupam a tela toda: o Kirby e o placar nem aparecem
  if (estado === 'titulo') { desenharTitulo(); return; }
  if (estado === 'modos') { desenharModos(); return; }

  // fundo e chão (repintar tudo a cada frame evita rastros)
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.fillStyle = '#6fcf6b';
  ctx.fillRect(0, ALTURA - 28, LARGURA, 28);

  desenharItens();

  // Kirby
  ctx.fillStyle = '#ffaed0';
  ctx.beginPath();
  ctx.arc(kirby.x, kirby.y, kirby.raio, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b1f4d';
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(kirby.x + lado * 10, kirby.y - 10, 4, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  desenharPlacar();
  ctx.font = '600 14px sans-serif';
  ctx.fillText('Recorde ' + recorde, 14, 50);
  ctx.font = '700 22px sans-serif'; // volta a fonte grande para os corações
  desenharTelas(); 
}

// ---------- Loop principal ----------
let tempoAnterior = 0;

function loopPrincipal(agora) {
  const dt = Math.min(0.033, (agora - tempoAnterior) / 1000 || 0);
  tempoAnterior = agora;

  // só atualiza a lógica quando está jogando; nos outros estados o jogo fica parado
  if (estado === 'jogando') {
    moverKirby(dt);
    atualizarItens(dt);
  }
  desenhar();
  requestAnimationFrame(loopPrincipal);
}
requestAnimationFrame(loopPrincipal);