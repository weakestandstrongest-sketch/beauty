// CPU（ひとりで遊ぶ相手）のテスト：どのゲームでも、ルールどおりの手を指し、最後まで遊べること
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as AI from '../js/asobi/ai.js';
import * as R from '../js/asobi/games/reversi-logic.js';
import * as G from '../js/asobi/games/gomoku-logic.js';
import * as C from '../js/asobi/games/chess-logic.js';
import * as S from '../js/asobi/games/minishogi-logic.js';
import * as Y from '../js/asobi/games/yacht-logic.js';
import * as HB from '../js/asobi/games/hitblow-logic.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

test('リバーシ：CPU は合法手を打ち、でたらめな相手に勝ち越す', () => {
  let wins = 0;
  for (let g = 0; g < 6; g++) {
    let st = R.initialState();
    while (!st.over) {
      const m = st.turn === R.WHITE ? AI.reversiMove(st, 'normal') : pick(R.legalMoves(st.board, st.turn));
      assert.ok(R.legalMoves(st.board, st.turn).includes(m));
      st = R.play(st, m);
    }
    const { black, white } = R.count(st.board);
    if (white > black) wins++;
  }
  assert.ok(wins >= 5, `勝ち ${wins}/6`);
});

test('五目並べ：CPU は四を止め、勝てるときは勝つ', () => {
  // 黒が横に4つ（片方空き）→ 白は止める
  let st = G.initialState();
  const moves = [7 * 15 + 3, 0, 7 * 15 + 4, 1, 7 * 15 + 5, 2, 7 * 15 + 6];
  for (const m of moves) st = G.play(st, m, 'free');
  const block = AI.gomokuMove(st, 'free', 'normal');
  assert.ok(block === 7 * 15 + 2 || block === 7 * 15 + 7, `止める手: ${block}`);
  // 白が4つ並んでいる → 五にする
  let s2 = G.initialState();
  for (const m of [100, 0, 120, 1, 140, 2, 160, 3, 180]) s2 = G.play(s2, m, 'free');
  const win = AI.gomokuMove(s2, 'free', 'normal');
  assert.equal(G.play(s2, win, 'free').winner, G.WHITE);
});

test('チェス：CPU は合法手を指し、ただで取れる駒を取る', () => {
  const st = C.fromFEN('4k3/8/8/3q4/8/8/3R4/7K b - - 0 1'); // 黒の番、白のルークがただ（守られていない）
  const m = AI.chessMove(st, 'normal');
  assert.ok(C.legalMoves(st).some((x) => x.from === m.from && x.to === m.to));
  assert.equal(C.squareName(m.to), 'd2');
  // でたらめな相手と数手
  let s2 = C.initialState();
  for (let i = 0; i < 16; i++) {
    const legal = C.legalMoves(s2); if (!legal.length) break;
    const mv = s2.turn === 'b' ? AI.chessMove(s2, 'easy') : pick(legal);
    assert.ok(legal.some((x) => x.from === mv.from && x.to === mv.to && x.promo === mv.promo));
    s2 = C.makeMove(s2, mv);
  }
});

test('5五将棋：CPU は合法手を指す（持ち駒・成りを含む）', () => {
  let st = S.initialState();
  for (let i = 0; i < 20; i++) {
    const legal = S.legalMoves(st); if (!legal.length) break;
    const mv = st.turn === 1 ? AI.shogiMove(st, i % 2 ? 'normal' : 'easy') : pick(legal);
    assert.ok(legal.some((x) => JSON.stringify(x) === JSON.stringify(mv)));
    st = S.makeMove(st, mv);
  }
});

test('ヨット：CPU は空いている欄を選び、12ラウンド遊べる', () => {
  const sheet = {};
  for (let r = 0; r < 12; r++) {
    let dice = Array.from({ length: 5 }, () => 1 + Math.floor(Math.random() * 6));
    for (let left = 2; left > 0; left--) {
      const keep = AI.yachtHold(sheet, dice, left, 'normal');
      if (!keep) break;
      dice = dice.map((v, i) => (keep[i] ? v : 1 + Math.floor(Math.random() * 6)));
    }
    const id = AI.yachtCategory(sheet, dice, 'normal');
    assert.ok(!(id in sheet));
    sheet[id] = Y.score(id, dice);
  }
  assert.ok(Y.isComplete(sheet));
  assert.ok(Y.totals(sheet).total > 60, `合計 ${Y.totals(sheet).total}`);
});

test('ヒット&ブロー：CPU は10回以内に当てる', () => {
  const opts = { length: 4, colors: 6, duplicates: false };
  for (const level of ['normal', 'hard']) {
    for (let g = 0; g < 5; g++) {
      const secret = AI.randomCode(opts);
      const hist = [];
      let n = 0, ok = false;
      while (n < 10) {
        const guess = AI.hitblowGuess(opts, hist, level);
        assert.ok(HB.isValidCode(guess, opts));
        const j = HB.judge(secret, guess); n++;
        if (j.hit === 4) { ok = true; break; }
        hist.push({ guess, ...j });
      }
      assert.ok(ok, `${level}: ${n}回で当てられなかった`);
    }
  }
});
