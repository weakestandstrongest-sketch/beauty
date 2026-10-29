import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../js/asobi/games/darts-logic.js';

// 角度 (真上 0、時計回り) と半径から座標へ
const at = (deg, r) => [Math.sin((deg * Math.PI) / 180) * r, -Math.cos((deg * Math.PI) / 180) * r];

test('盤の得点: 数字の並び', () => {
  assert.equal(D.hitAt(...at(0, 0.4)).label, '20');
  assert.equal(D.hitAt(...at(90, 0.4)).label, '6');
  assert.equal(D.hitAt(...at(180, 0.4)).label, '3');
  assert.equal(D.hitAt(...at(270, 0.4)).label, '11');
  assert.equal(D.hitAt(...at(18, 0.4)).label, '1');
  assert.equal(D.hitAt(...at(-18, 0.4)).label, '5');
  // 境目は 9 度
  assert.equal(D.hitAt(...at(8.9, 0.4)).n, 20);
  assert.equal(D.hitAt(...at(9.1, 0.4)).n, 1);
});

test('盤の得点: リング', () => {
  assert.deepEqual(D.hitAt(0, 0), { n: 25, m: 2, points: 50, label: 'BULL' });
  assert.equal(D.hitAt(0, -0.06).label, '25');
  assert.equal(D.hitAt(...at(0, 0.6)).label, 'T20');
  assert.equal(D.hitAt(...at(0, 0.6)).points, 60);
  assert.equal(D.hitAt(...at(0, 0.98)).label, 'D20');
  assert.equal(D.hitAt(...at(0, 0.98)).points, 40);
  assert.equal(D.hitAt(...at(0, 1.01)).points, 0);
  assert.equal(D.hitAt(...at(0, 1.01)).label, 'OUT');
});

test('カウントアップ: 8ラウンドで合計の多いほうが勝ち', () => {
  let s = D.newGame('countup');
  for (let r = 0; r < 8; r++) {
    for (let p = 0; p < 2; p++) {
      for (let i = 0; i < 3; i++) s = D.throwDart(s, ...at(0, p === 0 ? 0.6 : 0.4)); // 1P は T20、2P は 20
      assert.equal(s.turnOver, true);
      s = D.nextTurn(s);
    }
  }
  assert.equal(s.over, true);
  assert.equal(s.players[0].score, 8 * 180);
  assert.equal(s.players[1].score, 8 * 60);
  assert.equal(s.winner, 0);
});

test('301: バーストすると番の最初の点数に戻る', () => {
  let s = D.newGame('301');
  s = { ...s, players: [{ score: 40, turns: [] }, { score: 301, turns: [] }], turnStart: 40 };
  s = D.throwDart(s, ...at(0, 0.4)); // 20 → 残り 20
  assert.equal(s.players[0].score, 20);
  s = D.throwDart(s, ...at(0, 0.6)); // T20 で超える
  assert.equal(s.bust, true);
  assert.equal(s.turnOver, true);
  assert.equal(s.players[0].score, 40);
  s = D.nextTurn(s);
  assert.equal(s.turn, 1);
  assert.equal(s.bust, false);
});

test('301: ちょうど 0 で上がり', () => {
  let s = D.newGame('301');
  s = { ...s, players: [{ score: 32, turns: [] }, { score: 301, turns: [] }], turnStart: 32 };
  s = D.throwDart(s, ...at(234, 0.98)); // 方角 234 度は 16、ダブルで 32
  assert.equal(s.over, true);
  assert.equal(s.winner, 0);
});

test('ゼロワン: 上がりの組み合わせ', () => {
  assert.deepEqual(D.checkout(170), ['T20', 'T20', 'BULL']);
  assert.equal(D.checkout(181), null);
  assert.deepEqual(D.checkout(50, 1), ['BULL']);
  assert.equal(D.checkout(61, 1), null);
  const c = D.checkout(97);
  assert.ok(c.length <= 3);
});
