import React from 'react';

// 玩家状态类
class DefaultPlayerContext {
    constructor() {
        this.winnerNotis = []; // 登记赢得比赛的通知方法
        this.moveNotis = []; // 登记（合法）点击的通知方法
        let player = 1;
        let stepNumber = 0;
        this.getPlayer = ()=>player; // 获取玩家，1表示X，2表示O
        this.getStepNumber = ()=>stepNumber; // 步数
        const squares = Array(9).fill(null); // 9宫格，缺省都为null，玩家点击第几格，就标记第几格为玩家号（1或2）
        const steps = Array(9).fill(null); // 记录至多9个步骤的九宫格index
        let winner = null;
        let winLine = null;
        this.mark = (index)=>{
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
        this.getWinLine = ()=>winLine;
        this.getWinner = ()=>winner;
        this.getHistory = (stepCount)=>{
            return squares.slice(0, stepCount);
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
            marks: null,
            // 显示的marks
            marksdisplay : (
                <small><sub>{this.index}</sub></small>
            ),
            stepNumber: 0,
            // 是否在赢得比赛的三个点击中。标记marks旁的小字，表示第几步，红色表示成功的步骤
            inWinLine: false
        }
    }
    
    onClick = (() => {
        let player = this.context.getPlayer();
        if (this.state.marks !== null || !player) { // 已经被点击过，或者玩家尚未被初始化
            return;
        }
        let marks = null;
        if (player === 1) { // first player
            marks = 'X';
            this.context.mark(this.index);
        } else if (player === 2) { // second player
            marks = 'O';
            this.context.mark(this.index);
        } else if (player !== null) { // error
            marks = 'E';
        }
        let inWinLine = (this.context.getWinLine() !== null && this.context.getWinLine().indexOf(this.index) > -1);
        this.setState({
            marks: marks,
            marksdisplay: marks,
            stepNumber: this.context.getStepNumber(),
            inWinLine: inWinLine
        });
    })

    render() {
        console.log("Square[" + this.index + "] is rendering");
        let subs = null;
        if (this.state.stepNumber > 0) {
            if (this.state.inWinLine) {
                subs = (
                    <sub className="win">{this.state.stepNumber}</sub>
                )
            } else {
                subs = (
                    <sub>{this.state.stepNumber}</sub>
                )
            }
        }
        return (
            <button className="square" onClick={this.onClick}>
              {this.state.marksdisplay}{subs}
            </button>
          );
    }

    // 玩家胜利之后，需要标记赢得胜利的3个格子，但是只有Context变化了，需要在此方法内setState
    componentDidUpdate(prevProps, prevState) {
        let inWinLine = (this.context.getWinLine() !== null && this.context.getWinLine().indexOf(this.index) > -1);
        if (inWinLine !== this.state.inWinLine) {
            this.setState({
                inWinLine: inWinLine
            })
        }
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
  