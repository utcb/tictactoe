import React from 'react';

// 玩家状态类
class DefaultPlayerContext {
    constructor() {
        this.playNotis = []; // 登记玩家各类动作的消息通知方法
        let player = 1; // 当前玩家，即轮到该玩家下子
        let stepNumber = 0; // 步数，实际下子的数量。0表示尚未开始游戏，1表示下了第一个棋子
        this.getPlayer = ()=>player; // 获取玩家，1表示X，2表示O
        this.getStepNumber = ()=>stepNumber; // 步数
        /**
         * 棋盘历史，每个记录是一个sqauires(Array(9)），代表棋盘某一步骤的所有状态。
         * Array(9)里的状态记录：null表示尚未被点击；{player: 1/2, stepNumber: 步数, index: 即array索引（冗余）}
         */
        let history = [];
        this.getSquares = ()=>{ // 获取stepNumber步骤的“增强”squares. 全部为null的Array(9)表示第0步的结果，即初始值
            if (stepNumber === 0) {
                return Array(9).fill(null);
            }
            return history[stepNumber - 1];
        }
        const steps = Array(9).fill(null); // 记录至多9个步骤的九宫格index，表示每一步点击的是哪一个square
        let winner = null;
        let winLine = null;
        this.mark = (index)=>{ // 玩家成功点击方法
            // 重新设置steps, history等变量值，从stepNumber开始
            for (let i = stepNumber; i < 9; i++) {
                steps[i] = null;
            }
            history = history.slice(0, stepNumber);
            steps[stepNumber] = index
            let newSquare = this.getSquares().slice(0);
            newSquare[index] = {
                index: index,
                stepNumber: stepNumber + 1, // 第几步，从1开始
                player: player
            };
            history.push(newSquare);
            stepNumber += 1; // 步数++
            winLine = calculateWinner(this.getSquares());
            if (winLine === null) { // 尚未分出输赢，继续
                player = (player === 1 ? 2 : 1); // 交换玩家
            } else { // 结束
                winner = player;
                player = null;
            }
            for (let i = 0; i < this.playNotis.length; i++) {
                this.playNotis[i]();
            }
        };
        // this.getWinLine = ()=>winLine;
        this.getWinner = ()=>winner;
        this.getSteps = ()=>{
            return steps.slice(0, history.length);
        }
        // 指定index的square是否在winLine中
        this.inWinLine = (squareIndex) => {
            return (winLine !== null && winLine.indexOf(squareIndex) > -1);
        }
        this.jumpTo = (step)=>{ // step: 0表示初始，1表示第1步...
            stepNumber = step;
            player = (step % 2) + 1;
            winner = null;
            winLine = calculateWinner(this.getSquares());
            if (winLine != null) {
                player = (step % 2);
                winner = player;
            }
            for (let i = 0; i < this.playNotis.length; i++) {
                this.playNotis[i]();
            }
        };
    }
    // 登记各种玩家动作的通知方法
    registerPlayNoti(playNotificator) {
        this.playNotis.push(playNotificator);
    }
}

// 全局单例，表示玩家状态
var _singletonPlayerContext = null;
export function getSingletonPlayerContext(winNotificator) {
    if (!_singletonPlayerContext) {
        _singletonPlayerContext = new DefaultPlayerContext(winNotificator);
    }
    return _singletonPlayerContext;
}

export const PlayerContext = React.createContext();

/**
 * Square: 知道自身的位置（props.index: [0-8]）。外部props传入状态(props.value)
 */
export class Square extends React.Component {
    static contextType = PlayerContext;
    constructor(props) {
        super(props);
        this.index = props.index;
    }
    
    onClick = (() => { // TODO: 因为Square已经没有自己的state，该onClick方法，实际上可以通过props传入
        let player = this.context.getPlayer();
        if (!player) { // 玩家尚未被初始化
            return;
        }
        if (this.props.value && this.props.value[this.index] && this.props.value[this.index].player) { // 已经被点击过
            return;
        }
        if (player === 1 || player === 2) {
            this.context.mark(this.index); // 通知已经点击完毕
        }
    })

    render() {
        // console.log("Square[" + this.index + "] is rendering... squares is " + this.props.value);
        // according to props.value，即history的元素
        let marks = null;
        let player = null;
        let stepNumber = 0;
        if (this.props.value && this.props.value[this.index]) {
            let square = this.props.value[this.index];
            stepNumber = square.stepNumber;
            player = square.player;
        }
        let subs = null;
        if (player === 1 || player === 2) { // first player
            marks = player === 1 ? 'X' : 'O';
            // 是否在赢得比赛的三个点击中。标记marks旁的小字，表示第几步，红色表示成功的步骤
            if (stepNumber > 0) {
                if (this.context.inWinLine(this.index)) {
                    subs = (
                        <sub className="win">{stepNumber}</sub>
                    )
                } else {
                    subs = (
                        <sub>{stepNumber}</sub>
                    )
                }
            }
        } else if (player !== null) { // error
            marks = 'E';
        } else {
            marks = (
                <small><sub>{this.index}</sub></small>
            );
        }
        return (
            <button className="square" onClick={this.onClick}>
              {marks}{subs}
            </button>
          );
    }
}


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
  