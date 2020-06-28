import React from 'react';

// 玩家状态类
class DefaultPlayerContext {
    constructor() {
        this.winnerNotis = []; // 登记赢得比赛的通知方法
        this.moveNotis = []; // 登记（合法）点击的通知方法
        let player = 1; // 当前玩家，即轮到该玩家下子
        let stepNumber = 0; // 步数，实际下子的数量
        this.getPlayer = ()=>player; // 获取玩家，1表示X，2表示O
        this.getStepNumber = ()=>stepNumber; // 步数
        const squares = Array(9).fill(null); // 9宫格，缺省都为null，玩家点击第几格，就标记第几格为玩家号（1或2）
        const steps = Array(9).fill(null); // 记录至多9个步骤的九宫格index
        let winner = null;
        let winLine = null;
        let snapshot = null; // 当前快照，仅当history move时用到，平时设置为null
        this.mark = (index)=>{ // 玩家成功点击方法
            snapshot = null; // 清空快照
            steps[stepNumber] = index
            squares[index] = player;
            stepNumber += 1; // 步数++
            winLine = calculateWinner(squares);
            for (let i = 0; i < this.moveNotis.length; i++) {
                this.moveNotis[i]();
            }
            if (winLine === null) { // 尚未分出输赢，继续
                player = (player === 1 ? 2 : 1); // 交换玩家
            } else { // 结束
                winner = player;
                player = null;
                for (let i = 0; i < this.winnerNotis.length; i++) {
                    this.winnerNotis[i]();
                }
            }
        };
        // this.getWinLine = ()=>winLine;
        this.getWinner = ()=>winner;
        this.getSteps = ()=>{
            if (snapshot) {
                return snapshot.steps.slice(0, snapshot.stepNumber);
            } else {
                return steps.slice(0, stepNumber);
            }
        }
        // 指定index的square是否在winLine中
        this.inWinLine = (squareIndex) => {
            return (winLine !== null && winLine.indexOf(squareIndex) > -1);
        }
        this.jumpTo = (step)=>{
            // step: liternally from 1, internally from 0
            if (snapshot == null) {
                snapshot = {
                    player: player,
                    stepNumber: stepNumber,
                    squares: Array.from(squares),
                    steps: Array.from(steps),
                    winner: winner,
                    winLine: winLine
                };
            }
            for (let i = 0; i < 9; i++) {
                squares[i] = snapshot.squares[i];
                steps[i] = snapshot.steps[i];
            }
            for (let i = step; i < snapshot.steps.length; i++) {
                let move = snapshot.steps[i];
                squares[move] = null;
                steps[i] = null;
            }
            stepNumber = step;
            player = (step % 2) + 1;
            winner = null;
            winLine = calculateWinner(squares);
            if (winLine != null) {
                player = (step % 2);
                winner = player;
            }
            for (let i = 0; i < this.moveNotis.length; i++) {
                this.moveNotis[i]();
            }
            for (let i = 0; i < this.winnerNotis.length; i++) {
                this.winnerNotis[i]();
            }
        };
    }
    // 登记赢得比赛的通知方法
    registerWinnerNoti(winNotificator) {
        this.winnerNotis.push(winNotificator);
    }
    // 登记合法move的通知方法
    registerMoveNoti(moveNotificator) {
        this.moveNotis.push(moveNotificator);
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
 * Square: 知道自身的位置（props.index: [0-8]）、状态（state.marks: 'X'/'O'/null，分别代表被1号玩家点击、2号玩家点击和尚未被点击）
 */
export class Square extends React.Component {
    static contextType = PlayerContext;
    /* React.PureComponent skips shouldComponentUpdate and does shallowlly props/state comparison itself
    shouldComponentUpdate(nextProps, nextState) {
        return nextState.marks !== this.state.marks;
    }
    */

    constructor(props) {
        super(props);
        this.index = props.index;
        this.state = {
            player: null, // 点击玩家，null表示尚未点击
            stepNumber: 0
        }
    }
    
    onClick = (() => {
        let player = this.context.getPlayer();
        if (this.state.player !== null || !player) { // 已经被点击过，或者玩家尚未被初始化
            return;
        }
        if (player === 1 || player === 2) {
            this.context.mark(this.index);
        }
        this.setState({
            player: player,
            stepNumber: this.context.getStepNumber()
        });
    })

    render() {
        // console.log("Square[" + this.index + "] is rendering");
        let marks = null;
        let player = this.state.player;
        let stepNumber = this.state.stepNumber;
        if (stepNumber > this.context.getStepNumber()) {
            player = null;
            stepNumber = 0;
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
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return [a, b, c];
      }
    }
    return null;
  }
  