// Kirby Food Drop - Etapa 1: canvas, loop e movimento

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const LARGURA = canvas.width;
const ALTURA = canvas.height;

const kirby = { x: LARGURA / 2, y: ALTURA - 62, raio: 34, vx: 0 };
const teclas = {};

// ===== NOVO (passo 1): variáveis dos itens =====
const COMIDAS = ['🍎', '🍰', '🍉', '🍓', '🍩', '🍔'];
let itens = [];
let tempoNovoItem = 1;

let pontos = 0;
let vidas = 3;
// ===============================================

addEventListener('keydown', (e) => {
  if (e.key.startsWith('Arrow')) e.preventDefault();
  teclas[e.key.toLowerCase()] = true;
});

addEventListener('keyup', (e) => {
  teclas[e.key.toLowerCase()] = false;
});

function moverKirby(dt) {
  let direcao = 0;
  if (teclas['arrowright'] || teclas['d']) direcao += 1;
  if (teclas['arrowleft'] || teclas['a']) direcao -= 1;

  kirby.vx = direcao * 380;
  kirby.x += kirby.vx * dt;
  kirby.x = Math.max(kirby.raio, Math.min(LARGURA - kirby.raio, kirby.x));
}

// ===== NOVO (passo 2): as 3 funções que você mandou =====
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

    // colisão círculo com círculo: se a distância entre os centros
    // for menor que a soma dos raios, eles se encostaram
    const distancia = Math.hypot(kirby.x - item.x, kirby.y - item.y);
    if (distancia < kirby.raio + item.raio - 8) { // o -8 deixa a colisão um pouco mais gentil
      item.morto = true;
      if (item.tipo === 'comida') pontos += 10;
      else vidas--;
    }

    if (item.y > ALTURA + 30) item.morto = true;
  }
  itens = itens.filter((item) => !item.morto);

  // PROVISÓRIO: quando acabam as vidas, recomeça. Na etapa 3 isso vira a tela de Game Over.
  if (vidas <= 0) {
    vidas = 3;
    pontos = 0;
    itens = [];
  }
}

function desenharItens() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '38px sans-serif';
  for (const item of itens) ctx.fillText(item.emoji, item.x, item.y);
}
// ========================================================

function desenhar() {
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.fillStyle = '#6fcf6b';
  ctx.fillRect(0, ALTURA - 28, LARGURA, 28);

  desenharItens();   // ===== NOVO (passo 3): depois do chão, antes do Kirby =====

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
}

let tempoAnterior = 0;

function loopPrincipal(agora) {
  const dt = Math.min(0.033, (agora - tempoAnterior) / 1000 || 0);
  tempoAnterior = agora;

  moverKirby(dt);
  atualizarItens(dt);   // ===== NOVO (passo 4): depois de mover o Kirby =====
  desenhar();
  requestAnimationFrame(loopPrincipal);
}
requestAnimationFrame(loopPrincipal);