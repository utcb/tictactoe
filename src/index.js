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
    this.state = {
      stepNumber: 0,
      xIsNext: true,
      player: 1 // 当前玩家，1:X, 2:O。相当于上述xIsNext。player = xIsNext ? 1 : 2;
    };
  }
  render() {
    console.log("GameInfo is rendering...")
    const ctx = this.context;
    const history = ctx.getHistory(ctx.getStepNumber());
    const winner = ctx.getWinner();

    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move :
        'Go to game start';
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
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
          <ol>{moves}</ol>
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
    // if any player wins, force update whole game
    this.singletonPlayerContext = getSingletonPlayerContext();
    this.singletonPlayerContext.registerWinnerNoti(()=>this.forceUpdate());
    this.state = {
      history: [
        {
          squares: Array(9).fill(null)
        }
      ],
      stepNumber: 0,
      xIsNext: true,
      player: 1 // 当前玩家，1:X, 2:O。相当于上述xIsNext。player = xIsNext ? 1 : 2;
    };
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0
    });
  }

  render() {
    const ctx = this.singletonPlayerContext;
    const history = ctx.getHistory(ctx.getStepNumber());
    const winner = this.singletonPlayerContext.getWinner();

    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move :
        'Go to game start';
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
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
      <PlayerContext.Provider value={this.singletonPlayerContext}>
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


