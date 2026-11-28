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

// ---------- Inalar (Espaço) ----------
let folego = 100;          // energia da inalação (0 a 100)
let semFolego = false;     // true quando zerou: só volta a inalar depois de recuperar 30
let inalando = false;

// ---------- Vento ----------
let vento = 0;         // força que o vento quer alcançar (negativo = esquerda)
let ventoAtual = 0;    // força real: muda aos poucos para o vento não "dar um tranco"
let tempoVento = 3;    // segundos até o vento mudar

// ---------- Entrada ----------
addEventListener('keydown', (e) => {
  if (e.key.startsWith('Arrow')) e.preventDefault();
  if (e.key === ' ' && estado === 'jogando') e.preventDefault(); // espaço não rola a página durante o jogo
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
  folego = 100;
  semFolego = false;
  inalando = false;
  vento = 0;
  ventoAtual = 0;
  tempoVento = 0;
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

function atualizarFolego(dt) {
  inalando = !!teclas[' '] && !semFolego && folego > 0;

  if (inalando) {
    folego -= 35 * dt;                         // inalar gasta energia
    if (folego <= 0) { folego = 0; semFolego = true; }
  } else {
    folego = Math.min(100, folego + 22 * dt);  // descansando, recupera
    if (semFolego && folego > 30) semFolego = false;
  }
}

function atualizarVento(dt) {
  tempoVento -= dt;
  if (tempoVento <= 0) {
    const calmaria = Math.random() < 0.25;            // às vezes não venta
    vento = calmaria ? 0 : (Math.random() * 2 - 1) * 100;
    tempoVento = 4 + Math.random() * 3;
  }
  ventoAtual += (vento - ventoAtual) * Math.min(1, 1.5 * dt); // aproxima aos poucos
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

    // o vento empurra o item para o lado, sem deixar sair da tela
    item.x = Math.max(item.raio, Math.min(LARGURA - item.raio, item.x + ventoAtual * dt));

    // colisão círculo com círculo: distância entre os centros < soma dos raios
    const distancia = Math.hypot(kirby.x - item.x, kirby.y - item.y) || 1; // "|| 1" evita dividir por zero

    // inalando, os itens perto do Kirby são puxados na direção dele
    if (inalando && distancia < 180) {
      item.x += (kirby.x - item.x) / distancia * 340 * dt;
      item.y += (kirby.y - item.y) / distancia * 340 * dt;
    }    if (distancia < kirby.raio + item.raio - 8) {
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
  ctx.textAlign = 'left';

  ctx.font = '700 22px sans-serif';
  ctx.fillText('Pontos ' + pontos, 14, 30);
  ctx.font = '600 14px sans-serif';
  ctx.fillText('Recorde ' + recorde, 14, 50);

    // barra de fôlego (fica vermelha quando acaba)
  ctx.fillStyle = 'rgba(43, 45, 110, 0.25)';
  ctx.fillRect(14, 62, 120, 10);
  ctx.fillStyle = semFolego ? '#d8324f' : '#ffd23f';
  ctx.fillRect(14, 62, 120 * folego / 100, 10);

  ctx.font = '600 12px sans-serif';
  ctx.fillStyle = '#2b2d6e';
  ctx.fillText(semFolego ? 'sem fôlego!' : 'fôlego', 142, 71);

  ctx.textAlign = 'right';
  ctx.font = '700 22px sans-serif';
  ctx.fillText('❤️'.repeat(Math.max(0, vidas)), LARGURA - 14, 30);

    // vento: quanto mais setas, mais forte
  const v = Math.round(ventoAtual);
  const forca = 1 + (Math.abs(v) > 40) + (Math.abs(v) > 80); // cada "true" conta como 1
  ctx.font = '600 14px sans-serif';
  ctx.fillText('vento ' + (Math.abs(v) < 8 ? '·' : (v > 0 ? '→' : '←').repeat(forca)), LARGURA - 14, 56);
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

// Contorno escuro em volta do texto, para ler bem em qualquer fundo
function textoComContorno(texto, x, y, tamanho) {
  ctx.font = '800 ' + tamanho + 'px sans-serif';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(18, 20, 58, 0.85)';
  ctx.strokeText(texto, x, y);
  ctx.fillStyle = '#fff';
  ctx.fillText(texto, x, y);
}

// Cenário de cada coluna: 0 = paisagem, 1 = cinza, 2 = inferno
function desenharFundoDoModo(i, x) {
  const l = LARGURA_COLUNA;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, l, ALTURA);
  ctx.clip(); // nada vaza para a coluna do lado

  const cores = [['#8fd3ff', '#f4fbff'], ['#6b6b6b', '#a8a8a8'], ['#12000a', '#7a1010']][i];
  const ceu = ctx.createLinearGradient(0, 0, 0, ALTURA);
  ceu.addColorStop(0, cores[0]);
  ceu.addColorStop(1, cores[1]);
  ctx.fillStyle = ceu;
  ctx.fillRect(x, 0, l, ALTURA);

  if (i === 0) { // nuvens e colina verde
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    [[40, 110, 34], [110, 140, 28], [60, 440, 30], [120, 470, 24]].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.arc(x + cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#6fcf6b';
    ctx.beginPath();
    ctx.ellipse(x + 80, ALTURA, 150, 130, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (i === 1) { // chão de concreto
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(x, ALTURA - 90, l, 90);
  }
  if (i === 2) { // montanhas pontudas e lava
    ctx.fillStyle = '#2a0508';
    for (let m = 0; m < 3; m++) {
      ctx.beginPath();
      ctx.moveTo(x + m * 70 - 20, ALTURA - 90);
      ctx.lineTo(x + m * 70 + 35, ALTURA - 260);
      ctx.lineTo(x + m * 70 + 90, ALTURA - 90);
      ctx.fill();
    }
    ctx.fillStyle = '#ff4a1c';
    ctx.fillRect(x, ALTURA - 90, l, 90);
  }
  ctx.restore();
}

// Grade fininha por cima do cenário (visual arcade)
function desenharGrade(x) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let gx = x; gx <= x + LARGURA_COLUNA; gx += 32) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, ALTURA);
    ctx.stroke();
  }
  for (let gy = 0; gy <= ALTURA; gy += 32) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + LARGURA_COLUNA, gy);
    ctx.stroke();
  }
}

function elipse(x, y, rx, ry, cor) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Kirby só de enfeite na seleção: i = 0 angelical, 1 sério, 2 maligno
function desenharKirbyDoModo(i, x, y) {
  const r = 46;

  if (i === 0) { // asas e auréola
    elipse(x - r * 1.05, y - r * 0.1, r * 0.55, r * 0.35, '#ffffff');
    elipse(x + r * 1.05, y - r * 0.1, r * 0.55, r * 0.35, '#ffffff');
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(x, y - r * 1.2, r * 0.5, r * 0.16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (i === 2) { // chifres
    ctx.fillStyle = '#c8181f';
    for (const lado of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + lado * r * 0.35, y - r * 0.85);
      ctx.lineTo(x + lado * r * 0.75, y - r * 0.7);
      ctx.lineTo(x + lado * r * 0.8, y - r * 1.4);
      ctx.fill();
    }
  }

  // pés, mãos, corpo e bochechas
  const corCorpo = ['#ffc6dd', '#ffaed0', '#ffaed0'][i];
  elipse(x - r * 0.55, y + r * 0.85, r * 0.45, r * 0.28, '#d8324f');
  elipse(x + r * 0.55, y + r * 0.85, r * 0.45, r * 0.28, '#d8324f');
  elipse(x - r * 0.95, y + 4, r * 0.3, r * 0.22, '#ff8fb8');
  elipse(x + r * 0.95, y + 4, r * 0.3, r * 0.22, '#ff8fb8');
  elipse(x, y, r, r * 0.95, corCorpo);
  elipse(x - r * 0.55, y + r * 0.2, r * 0.2, r * 0.12, '#ff6f9f');
  elipse(x + r * 0.55, y + r * 0.2, r * 0.2, r * 0.12, '#ff6f9f');

  // olhos (vermelhos no maligno)
  const corOlho = i === 2 ? '#ff2d2d' : '#1b1f4d';
  for (const lado of [-1, 1]) {
    elipse(x + lado * r * 0.3, y - r * 0.3, r * 0.12, r * 0.28, corOlho);
    elipse(x + lado * r * 0.3, y - r * 0.42, r * 0.07, r * 0.1, '#fff');
  }

  ctx.lineCap = 'round';

  // sobrancelhas: quase retas no sério, bem inclinadas no maligno
  if (i === 1 || i === 2) {
    ctx.strokeStyle = '#1b1f4d';
    ctx.lineWidth = 4;
    const yFora = y - r * (i === 2 ? 0.84 : 0.74);
    const yDentro = y - r * (i === 2 ? 0.48 : 0.62);
    for (const lado of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + lado * r * 0.5, yFora);
      ctx.lineTo(x + lado * r * 0.12, yDentro);
      ctx.stroke();
    }
  }
  
  if (i === 2) { // presas
    ctx.fillStyle = '#fff';
    for (const lado of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + lado * r * 0.12, y + r * 0.34);
      ctx.lineTo(x + lado * r * 0.22, y + r * 0.34);
      ctx.lineTo(x + lado * r * 0.17, y + r * 0.48);
      ctx.fill();
    }
  }
  ctx.lineCap = 'butt';

  // boca: sorriso, linha reta ou sorriso malvado com presas
  ctx.strokeStyle = '#5a1030';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (i === 0) {
    ctx.arc(x, y + r * 0.1, r * 0.2, 0.2, Math.PI - 0.2);
  } else if (i === 1) {
    ctx.moveTo(x - r * 0.16, y + r * 0.3);
    ctx.lineTo(x + r * 0.16, y + r * 0.3);
  } else {
    ctx.arc(x, y + r * 0.12, r * 0.28, 0.1, Math.PI - 0.1);
  }
  ctx.stroke(); 
}

function desenharModos() {
  MODOS.forEach((m, i) => {
    const x = i * LARGURA_COLUNA;
    const centro = x + LARGURA_COLUNA / 2;

    desenharFundoDoModo(i, x);
    desenharGrade(x);

    desenharKirbyDoModo(i, centro, 175);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    textoComContorno(m.nome, centro, ALTURA / 2, 30);
    m.desc.forEach((linha, j) => textoComContorno(linha, centro, ALTURA / 2 + 38 + j * 22, 16));
    textoComContorno('tecla ' + (i + 1), centro, ALTURA - 40, 14);

    ctx.strokeStyle = '#12143a'; // moldura de cada retângulo
    ctx.lineWidth = 4;
    ctx.strokeRect(x, 0, LARGURA_COLUNA, ALTURA);
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
    atualizarFolego(dt);
    atualizarVento(dt);
    atualizarItens(dt);
  }
  desenhar();
  requestAnimationFrame(loopPrincipal);
}
requestAnimationFrame(loopPrincipal);