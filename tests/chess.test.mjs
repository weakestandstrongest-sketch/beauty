import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../js/asobi/games/chess-logic.js';

test('perft: 初期局面', () => {
  const s = C.initialState();
  assert.equal(C.perft(s, 1), 20);
  assert.equal(C.perft(s, 2), 400);
  assert.equal(C.perft(s, 3), 8902);
  assert.equal(C.perft(s, 4), 197281);
});

test('perft: Kiwipete (キャスリング・アンパッサン・昇格)', () => {
  const s = C.fromFEN('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
  assert.equal(C.perft(s, 1), 48);
  assert.equal(C.perft(s, 2), 2039);
  assert.equal(C.perft(s, 3), 97862);
});

test('perft: position 3 / 4', () => {
  assert.equal(C.perft(C.fromFEN('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1'), 4), 43238);
  assert.equal(C.perft(C.fromFEN('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1'), 3), 9467);
});

test('チェックメイトとステイルメイト', () => {
  let s = C.initialState();
  const keys = [C.positionKey(s)];
  for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) {
    const m = C.legalMoves(s).find((m) => m.from === C.squareIndex(f) && m.to === C.squareIndex(t));
    s = C.makeMove(s, m);
    keys.push(C.positionKey(s));
  }
  assert.deepEqual(C.gameStatus(s, keys), { over: true, winner: 'b', reason: 'チェックメイト' });
  const stale = C.fromFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(C.gameStatus(stale).reason, 'ステイルメイト');
});

test('駒不足と千日手', () => {
  assert.equal(C.insufficientMaterial(C.fromFEN('8/8/4k3/8/8/2B5/4K3/8 w - - 0 1').board), true);
  assert.equal(C.insufficientMaterial(C.fromFEN('8/8/4k3/8/8/2R5/4K3/8 w - - 0 1').board), false);
  let s = C.initialState();
  const keys = [C.positionKey(s)];
  const seq = [['g1', 'f3'], ['g8', 'f6'], ['f3', 'g1'], ['f6', 'g8']];
  let status;
  for (let i = 0; i < 8; i++) {
    const [f, t] = seq[i % 4];
    s = C.makeMove(s, C.legalMoves(s).find((m) => m.from === C.squareIndex(f) && m.to === C.squareIndex(t)));
    keys.push(C.positionKey(s));
    status = C.gameStatus(s, keys);
    if (i < 7) assert.equal(status.over, false);
  }
  assert.equal(status.reason, '同一局面3回');
});
