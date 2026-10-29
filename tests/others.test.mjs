import test from 'node:test';
import assert from 'node:assert/strict';
import * as Y from '../js/asobi/games/yacht-logic.js';
import * as H from '../js/asobi/games/hitblow-logic.js';
import * as G from '../js/asobi/games/gomoku-logic.js';
import * as R from '../js/asobi/games/reversi-logic.js';

test('ヨットの得点', () => {
  assert.equal(Y.score('threes', [3, 3, 1, 3, 5]), 9);
  assert.equal(Y.score('choice', [1, 2, 3, 4, 6]), 16);
  assert.equal(Y.score('four', [2, 2, 2, 2, 6]), 14);
  assert.equal(Y.score('four', [2, 2, 2, 6, 6]), 0);
  assert.equal(Y.score('four', [5, 5, 5, 5, 5]), 25);
  assert.equal(Y.score('full', [2, 2, 2, 6, 6]), 18);
  assert.equal(Y.score('full', [5, 5, 5, 5, 5]), 0);
  assert.equal(Y.score('sstraight', [1, 3, 4, 2, 6]), 15);
  assert.equal(Y.score('sstraight', [1, 3, 5, 2, 6]), 0);
  assert.equal(Y.score('lstraight', [2, 3, 4, 5, 6]), 30);
  assert.equal(Y.score('lstraight', [1, 2, 3, 4, 6]), 0);
  assert.equal(Y.score('yacht', [4, 4, 4, 4, 4]), 50);
  const sheet = { ones: 3, twos: 6, threes: 9, fours: 12, fives: 15, sixes: 18, yacht: 50 };
  assert.deepEqual(Y.totals(sheet), { upper: 63, bonus: 35, total: 148 });
});

test('ヒットアンドブローの判定', () => {
  assert.deepEqual(H.judge([0, 1, 2, 3], [0, 1, 2, 3]), { hit: 4, blow: 0 });
  assert.deepEqual(H.judge([0, 1, 2, 3], [3, 2, 1, 0]), { hit: 0, blow: 4 });
  assert.deepEqual(H.judge([0, 1, 2, 3], [0, 2, 4, 5]), { hit: 1, blow: 1 });
  assert.deepEqual(H.judge([0, 0, 1, 1], [0, 1, 0, 0]), { hit: 1, blow: 2 });
  assert.equal(H.isValidCode([0, 0, 1, 2], { length: 4, colors: 6, duplicates: false }), false);
  assert.equal(H.isValidCode([0, 0, 1, 2], { length: 4, colors: 6, duplicates: true }), true);
});

const idx = (r, c) => r * G.SIZE + c;
function boardWith(black, white = []) {
  const b = Array(G.SIZE * G.SIZE).fill(0);
  for (const [r, c] of black) b[idx(r, c)] = G.BLACK;
  for (const [r, c] of white) b[idx(r, c)] = G.WHITE;
  return b;
}

test('五目並べ: 勝ちと長連', () => {
  let s = G.initialState();
  const black = [[7, 3], [7, 4], [7, 5], [7, 6], [7, 7]];
  const white = [[0, 0], [0, 2], [0, 4], [0, 6]];
  for (let i = 0; i < 5; i++) {
    s = G.play(s, idx(...black[i]), 'free');
    if (i < 4) s = G.play(s, idx(...white[i]), 'free');
  }
  assert.equal(s.winner, G.BLACK);
  assert.equal(s.line.length, 5);
  const b = boardWith([[7, 2], [7, 3], [7, 4], [7, 6], [7, 7]]);
  assert.equal(G.forbiddenReason(b, idx(7, 5)), '長連');
  assert.equal(G.winningLine(Object.assign(b.slice(), { [idx(7, 5)]: G.BLACK }), idx(7, 5), G.WHITE, 'free'), null);
});

test('五目並べ: 三三・四四の禁じ手', () => {
  // 三三
  const b33 = boardWith([[7, 5], [7, 6], [5, 7], [6, 7]]);
  assert.equal(G.forbiddenReason(b33, idx(7, 7)), '三三');
  // 片側が止まっている三は三ではない
  const bNot = boardWith([[7, 5], [7, 6], [5, 7], [6, 7]], [[7, 4]]);
  assert.equal(G.forbiddenReason(bNot, idx(7, 7)), null);
  // 四四
  const b44 = boardWith([[7, 4], [7, 5], [7, 6], [4, 7], [5, 7], [6, 7]], [[7, 3], [3, 7]]);
  assert.equal(G.forbiddenReason(b44, idx(7, 7)), '四四');
  // 一直線上の四四 (X.XXX.X)
  const bLine = boardWith([[7, 1], [7, 3], [7, 4], [7, 7]]);
  assert.equal(G.forbiddenReason(bLine, idx(7, 5)), '四四');
  // 五ができるなら禁じ手より優先
  const b5 = boardWith([[7, 3], [7, 4], [7, 5], [7, 6], [5, 7], [6, 7], [8, 7]]);
  assert.equal(G.forbiddenReason(b5, idx(7, 7)), null);
  // 四三は禁じ手ではない
  const b43 = boardWith([[7, 4], [7, 5], [7, 6], [5, 7], [6, 7]], [[7, 3]]);
  assert.equal(G.forbiddenReason(b43, idx(7, 7)), null);
});

test('リバーシ: 初期の合法手とパス', () => {
  const s = R.initialState();
  assert.deepEqual(R.legalMoves(s.board, R.BLACK), [19, 26, 37, 44]);
  const n = R.play(s, 19);
  assert.deepEqual(R.count(n.board), { black: 4, white: 1 });
  assert.equal(n.turn, R.WHITE);
  // 白が置けず黒だけが置ける局面 → パス
  const board = Array(64).fill(0);
  board[0] = R.BLACK; board[1] = R.WHITE; board[3] = R.WHITE;
  const p = R.play({ board, turn: R.BLACK }, 2);
  assert.equal(p.passed, true);
  assert.equal(p.turn, R.BLACK);
  const end = R.play(p, 4);
  assert.equal(end.over, true);
  assert.deepEqual(R.count(end.board), { black: 5, white: 0 });
});
