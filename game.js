// Kirby Food Drop - Etapa 1: canvas, loop e movimento

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const LARGURA = canvas.width;
const ALTURA = canvas.height;

// O Kirby: posição, tamanho e velocidade horizontal
const kirby = { x: LARGURA / 2, y: ALTURA - 62, raio: 34, vx: 0 };

// Guarda quais teclas estão apertadas neste momento
const teclas = {};

addEventListener('keydown', (e) => {
  if (e.key.startsWith('Arrow')) e.preventDefault(); // não deixa a página rolar
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

  // não deixa o Kirby sair da tela
  kirby.x = Math.max(kirby.raio, Math.min(LARGURA - kirby.raio, kirby.x));
}

function desenhar() {
  // 1) pinta o fundo de novo a cada frame: é isso que apaga o frame anterior e evita rastros
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  // 2) chão
  ctx.fillStyle = '#6fcf6b';
  ctx.fillRect(0, ALTURA - 28, LARGURA, 28);

  // 3) Kirby (por enquanto: um círculo rosa com dois olhos)
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

// O loop principal: roda uma vez por frame (cerca de 60 vezes por segundo)
let tempoAnterior = 0;

function loopPrincipal(agora) {
  // dt = segundos desde o último frame; assim a velocidade é igual em qualquer computador
  const dt = Math.min(0.033, (agora - tempoAnterior) / 1000 || 0);
  tempoAnterior = agora;

  moverKirby(dt);
  desenhar();
  requestAnimationFrame(loopPrincipal);
}
requestAnimationFrame(loopPrincipal);