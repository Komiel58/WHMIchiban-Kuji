// 景品は合計111本。1等1、2等10、3等20、4等30、5等50。
const prizes = [
  { rank: '1等', name: 'ぬいぐるみ', count: 1 },
  { rank: '2等', name: 'アクリルスタンド', count: 10 },
  { rank: '3等', name: 'キーホルダー', count: 20 },
  { rank: '4等', name: 'ステッカー', count: 30 },
  { rank: '5等', name: 'バッチ', count: 50 }
];

// パスコードは config.js から読み込み

// 在庫管理
function getStock() {
  const stored = localStorage.getItem('lotteryStock');
  if (stored) {
    return JSON.parse(stored);
  }
  // 初期在庫を保存
  const initialStock = prizes.map(p => ({ rank: p.rank, name: p.name, count: p.count }));
  localStorage.setItem('lotteryStock', JSON.stringify(initialStock));
  return initialStock;
}

function updateStock(rank) {
  const stock = getStock();
  const item = stock.find(s => s.rank === rank);
  if (item && item.count > 0) {
    item.count--;
    localStorage.setItem('lotteryStock', JSON.stringify(stock));
  }
}

// 販売履歴管理
function getSalesHistory() {
  const stored = localStorage.getItem('lotterySalesHistory');
  return stored ? JSON.parse(stored) : [];
}

function addSalesHistory(rank, name) {
  const history = getSalesHistory();
  history.unshift({
    rank,
    name,
    timestamp: new Date().toLocaleString('ja-JP')
  });
  localStorage.setItem('lotterySalesHistory', JSON.stringify(history));
}

function draw() {
  const total = prizes.reduce((s, p) => s + p.count, 0);
  let n = Math.floor(Math.random() * total);
  for (const p of prizes) {
    if (n < p.count) return p;
    n -= p.count;
  }
  return prizes.at(-1);
}

let selected = draw();

const canvas = document.getElementById('scratch');
const ctx = canvas.getContext('2d');
const area = canvas.parentElement;

function updatePrizeDisplay() {
  document.getElementById('rank').textContent = selected.rank;
  document.getElementById('prize').textContent = selected.name;
}

updatePrizeDisplay();

function setup() {
  const r = area.getBoundingClientRect();
  const d = devicePixelRatio || 1;
  canvas.width = r.width * d;
  canvas.height = r.height * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);

  const g = ctx.createLinearGradient(0, 0, r.width, r.height);
  g.addColorStop(0, '#777');
  g.addColorStop(0.3, '#eee');
  g.addColorStop(0.55, '#999');
  g.addColorStop(0.8, '#eee');
  g.addColorStop(1, '#777');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r.width, r.height);

  ctx.fillStyle = '#444';
  ctx.font = '900 27px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCRATCH!', r.width / 2, r.height / 2);
}

setup();

let down = false;
let moves = 0;
let done = false;

function pos(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches?.[0] || e;
  return {
    x: p.clientX - r.left,
    y: p.clientY - r.top
  };
}

function scratch(e) {
  if (!down || done) return;
  e.preventDefault();
  const p = pos(e);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 27, 0, Math.PI * 2);
  ctx.fill();
  if (++moves > 36) finish();
}

function finish() {
  if (done) return;
  done = true;
  canvas.style.transition = 'opacity .5s';
  canvas.style.opacity = 0;
  setTimeout(() => {
    canvas.style.display = 'none';
    document.getElementById('hint').textContent = '結果が出ました！';
    document.getElementById('finalRank').textContent = selected.rank;
    document.getElementById('finalPrize').textContent = selected.name;
    document.getElementById('resultBox').classList.remove('hidden');
    // 販売履歴に追加
    addSalesHistory(selected.rank, selected.name);
  }, 450);
}

function resetGame() {
  selected = draw();
  updatePrizeDisplay();
  
  down = false;
  moves = 0;
  done = false;
  
  canvas.style.display = 'block';
  canvas.style.opacity = 1;
  canvas.style.transition = '';
  
  setup();
  
  document.getElementById('hint').textContent = '指でこすって削る';
  document.getElementById('resultBox').classList.add('hidden');
  document.getElementById('usedBox').classList.add('hidden');
  document.getElementById('pass').value = '';
  document.getElementById('error').textContent = '';
}

canvas.addEventListener('pointerdown', e => {
  down = true;
  canvas.setPointerCapture?.(e.pointerId);
  scratch(e);
});
canvas.addEventListener('pointermove', scratch);
canvas.addEventListener('pointerup', () => down = false);
canvas.addEventListener('pointercancel', () => down = false);

const modal = document.getElementById('modal');

document.getElementById('staffBtn').onclick = () => {
  modal.classList.remove('hidden');
};

document.getElementById('cancelBtn').onclick = () => {
  modal.classList.add('hidden');
};

document.getElementById('exchangeBtn').onclick = () => {
  if (document.getElementById('pass').value !== CONFIG.STAFF_PASSWORD) {
    document.getElementById('error').textContent = 'パスコードが違います';
    return;
  }
  modal.classList.add('hidden');
  document.getElementById('resultBox').classList.add('hidden');
  document.getElementById('usedBox').classList.remove('hidden');
  document.getElementById('usedText').textContent = selected.rank + ' ' + selected.name;
  document.getElementById('usedTime').textContent = '交換日時：' + new Date().toLocaleString('ja-JP');
  // 在庫を減らす
  updateStock(selected.rank);
};

document.getElementById('playAgainBtn').onclick = () => {
  resetGame();
};
