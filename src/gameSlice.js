import { createSlice } from '@reduxjs/toolkit';


export const gameSlice = createSlice({
  name: 'game',
  initialState: {
    player: 1, // 当前玩家，即轮到该玩家下子。缺省为1，表示第一个玩家，页面上表示为'X'。2表示第二个玩家，表示为'O'
    stepNumber: 0, // 步数，实际下子的数量。0表示尚未开始游戏，1表示下了第一个棋子
    /**
     * 棋盘历史，每个记录是一个sqauires(Array(9)），代表棋盘某一步骤的所有状态。
     *    Array(9)里的状态记录：null表示尚未被点击；
     *    {player: 1/2, stepNumber: 步数, index: 即array索引（冗余）, inWinLine: true/false 是否在winLine内}
     */
    history: [],
    steps: Array(9).fill(null), // 记录至多9个步骤的九宫格index，表示每一步点击的是哪一个square
    winner: null,
    winLine: null
  },
  reducers: {
    markOn: (state, action) => { // 玩家成功点击某个格子（index）
      let index = action.payload;
      let player = state.player;
      if (player < 1 || player > 2) { // 玩家尚未被初始化或错误
        return;
      }
      let squares = _getSquares(state);
      if (squares && squares[index] && squares[index].player) { // 已经被点击过
        return;
      }
      // 重新设置steps, history等变量值，从stepNumber开始
      for (let i = state.stepNumber; i < 9; i++) {
        state.steps[i] = null;
      }
      state.history = state.history.slice(0, state.stepNumber);
      state.steps[state.stepNumber] = index
      let newSquare = _getSquares(state).slice(0);
      newSquare[index] = {
          index: index,
          stepNumber: state.stepNumber + 1, // 第几步，从1开始
          player: state.player,
          inWinLine: false
      };
      state.history.push(newSquare);
      state.stepNumber += 1; // 步数++
      state.winLine = calculateWinner(_getSquares(state));
      if (state.winLine === null) { // 尚未分出输赢，继续
        state.player = (state.player === 1 ? 2 : 1); // 交换玩家
      } else { // 结束
        state.winner = state.player;
        state.player = null;
        state.winLine.forEach(i => { // 设置inWinLine状态
          newSquare[i].inWinLine = true;
        });
      }
    },
    jumpTo: (state, action) => {
      let step = action.payload;
      state.stepNumber = step;
      state.player = (step % 2) + 1;
      state.winner = null;
      state.winLine = calculateWinner(_getSquares(state));
      if (state.winLine != null) {
        state.player = (step % 2);
        state.winner = state.player;
      }
    }
  },
});

const _getSquares = state=>{
  if (state.stepNumber === 0) {
    return Array(9).fill(null);
  }
  return state.history[state.stepNumber - 1];
};

export const { markOn, jumpTo } = gameSlice.actions;

export const getSquares = state => { // 获取stepNumber步骤的“增强”squares. 全部为null的Array(9)表示第0步的结果，即初始值
  return _getSquares(state.game);
};

export const getPlayer = state => state.game.player;

export const getSteps = state => state.game.steps.slice(0, state.game.history.length);

export const getWinner = state => state.game.winner;

export const getStepNumber = state => state.game.stepNumber;

export function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[b] && squares[c] && squares[a].player &&  squares[a].player === squares[b].player && squares[a].player === squares[c].player) {
      return [a, b, c];
    }
  }
  return null;
}

export default gameSlice.reducer;
