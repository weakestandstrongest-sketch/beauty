import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/asobi/games/minishogi-logic.js';

test('perft: 初期局面', () => {
  const s = S.initialState();
  assert.equal(S.perft(s, 1), 14);
  assert.equal(S.perft(s, 2), 181);
  assert.equal(S.perft(s, 3), 2512);
  assert.equal(S.perft(s, 4), 35401);
});

function empty(turn = 0) {
  return { board: Array(25).fill(null), hands: [{ R: 0, B: 0, G: 0, S: 0, P: 0 }, { R: 0, B: 0, G: 0, S: 0, P: 0 }], turn };
}

test('打ち歩詰めは禁止、二歩も禁止', () => {
  const s = empty();
  s.board[2] = { o: 1, t: 'K', p: false };   // 後手玉 3一
  s.board[1] = { o: 1, t: 'S', p: false };   // 自分の銀が逃げ道をふさぐ
  s.board[3] = { o: 1, t: 'S', p: false };
  s.board[12] = { o: 0, t: 'G', p: false };  // 歩を支える金 (3三)
  s.board[6] = { o: 0, t: 'G', p: false };   // 4二
  s.board[8] = { o: 0, t: 'G', p: false };   // 2二 は空けない
  s.board[24] = { o: 0, t: 'K', p: false };
  s.hands[0].P = 1;
  const moves = S.legalMoves(s);
  assert.ok(!moves.some((m) => m.drop === 'P' && m.to === 7), '3二歩打は打ち歩詰め');

  const t = empty();
  t.board[0] = { o: 1, t: 'K', p: false };
  t.board[24] = { o: 0, t: 'K', p: false };
  t.board[17] = { o: 0, t: 'P', p: false };  // 3筋に歩
  t.hands[0].P = 1;
  const drops = S.legalMoves(t).filter((m) => m.drop === 'P').map((m) => m.to % 5);
  assert.ok(!drops.includes(2), '二歩');
  assert.ok(!S.legalMoves(t).some((m) => m.drop === 'P' && m.to < 5), '1段目には打てない');
});

test('成り: 歩は最奥で必ず成る、銀は選べる', () => {
  const s = empty();
  s.board[24] = { o: 0, t: 'K', p: false };
  s.board[4] = { o: 1, t: 'K', p: false };
  s.board[5] = { o: 0, t: 'P', p: false };
  s.board[7] = { o: 0, t: 'S', p: false };
  const moves = S.legalMoves(s);
  const pawn = moves.filter((m) => m.from === 5);
  assert.deepEqual(pawn.map((m) => m.promote), [true]);
  const silver = moves.filter((m) => m.from === 7 && m.to === 2);
  assert.deepEqual(silver.map((m) => m.promote).sort(), [false, true]);
  // 敵陣から出る銀も成れる
  const t = empty();
  t.board[24] = { o: 0, t: 'K', p: false };
  t.board[4] = { o: 1, t: 'K', p: false };
  t.board[1] = { o: 0, t: 'S', p: false };
  assert.ok(S.legalMoves(t).some((m) => m.from === 1 && m.to === 5 && m.promote));
});

test('詰みで勝敗、千日手は先手の負け', () => {
  const s = empty(1);
  s.board[0] = { o: 1, t: 'K', p: false };
  s.board[5] = { o: 0, t: 'G', p: false };
  s.board[10] = { o: 0, t: 'P', p: false };
  s.board[1] = { o: 0, t: 'R', p: true };
  s.board[24] = { o: 0, t: 'K', p: false };
  assert.deepEqual(S.gameStatus(s), { over: true, winner: 0, reason: '詰み' });

  const h = [];
  let st = S.initialState();
  h.push({ key: S.positionKey(st), check: false, turn: st.turn });
  const seq = [[21, 16], [3, 8], [16, 21], [8, 3]];
  let status;
  for (let i = 0; i < 12; i++) {
    const [from, to] = seq[i % 4];
    st = S.makeMove(st, S.legalMoves(st).find((m) => m.from === from && m.to === to && !m.promote));
    h.push({ key: S.positionKey(st), check: S.inCheck(st), turn: st.turn });
    status = S.gameStatus(st, h);
    if (i < 11) assert.equal(status.over, false);
  }
  assert.equal(status.winner, 1);
});
