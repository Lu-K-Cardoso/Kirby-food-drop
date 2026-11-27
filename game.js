// Kirby Food Drop

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const LARGURA = canvas.width;
const ALTURA = canvas.height;

// ---------- Estado do jogo ----------
let estado = 'menu';   // 'menu', 'jogando' ou 'fim' (game over)
let pontos = 0;
let vidas = 3;
let recorde = Number(localStorage.getItem('kirbyRecorde')) || 0; // fica salvo no navegador

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

  // Enter começa ou reinicia o jogo (menos quando já está jogando)
  if (e.key === 'Enter' && estado !== 'jogando') iniciarJogo();
});

addEventListener('keyup', (e) => {
  teclas[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', () => {
  if (estado !== 'jogando') iniciarJogo();
});

// ---------- Controle do jogo ----------
function iniciarJogo() {
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
  if (estado === 'menu') {
    desenharCamada('Kirby Food Drop', [
      'Pegue as comidas e desvie das bombas',
      '← → ou A D para mover',
      'Aperte Enter ou clique para jogar'
    ]);
  }
  if (estado === 'fim') {
    desenharCamada('Game Over', [
      'Pontos: ' + pontos + '   Recorde: ' + recorde,
      'Aperte Enter ou clique para tentar de novo'
    ]);
  }
}

function desenhar() {
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