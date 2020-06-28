import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {Square, PlayerContext, getSingletonPlayerContext} from './modules';

/*
function Square(props) {
  return (
    <button className="square" onClick={props.onClick}>
      {props.value}
    </button>
  );
}
*/

class Board extends React.Component {
  render() {
    return (
      <div className="game-board">
        <div>
          <div className="board-row">
            <Square index={0}/>
            <Square index={1}/>
            <Square index={2}/>
          </div>
          <div className="board-row">
            <Square index={3}/>
            <Square index={4}/>
            <Square index={5}/>
          </div>
          <div className="board-row">
            <Square index={6}/>
            <Square index={7}/>
            <Square index={8}/>
          </div>
        </div>
      </div>
    );
  }
}

class GameInfo extends React.Component {
  static contextType = PlayerContext;
  constructor(props) {
    super(props);
    this.moveNotiRegistered = false;
    this.state = {
      stepNumber: 0,
      xIsNext: true
    };
  }

  componentDidMount() {
    if (!this.moveNotiRegistered) {
      this.context.registerMoveNoti(()=>this.onMove());
      this.moveNotiRegistered = true;
    }
  }

  onMove() {
    let ctx = this.context;
    this.setState({
      stepNumber: ctx.getStepNumber(),
      xIsNext: (ctx.getPlayer() === 1) // 当前玩家，1:X, 2:O。相当于上述xIsNext。player = xIsNext ? 1 : 2;
    });
  }

  jumpTo(step) {
    const ctx = this.context;
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0
    });
    ctx.jumpTo(step);
  }

  render() {
    // console.log("GameInfo is rendering...")
    const ctx = this.context;
    const history = ctx.getSteps();
    const winner = ctx.getWinner();

    const moves = history.map((move, step) => {
      const desc = 'Go to move #' + move;
      return (
        <li key={step+1}>
          <button onClick={() => this.jumpTo(step+1)}>{desc}</button>
        </li>
      );
    });

    let status;
    if (winner) {
      status = "Winner: " + winner;
    } else {
      status = "Next player: " + (this.state.xIsNext ? "X" : "O");
    }
    return (
      <div className="game-info">
          <div>{status}</div>
          <ol>
            <li key={0}>
              <button onClick={() => this.jumpTo(0)}>Go to game start</button>
            </li>
            {moves}</ol>
      </div>
    )
  }
}

/**
 * 一个game由两个玩家和一个Board组成
 */
class Game extends React.Component {
  constructor(props) {
    super(props);
    this.ctx = getSingletonPlayerContext();
    // if any player wins, force update whole game
    this.ctx.registerWinnerNoti(()=>this.forceUpdate());
  }

  render() {
    return (
      <PlayerContext.Provider value={this.ctx}>
        <div className="game">
          <Board />
          <GameInfo />
        </div>
      </PlayerContext.Provider>
    );
  }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));


