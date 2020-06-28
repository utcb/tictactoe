import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {Square, PlayerContext, getSingletonPlayerContext} from './modules';

class Board extends React.Component {
  render() {
    return (
      <PlayerContext.Consumer>
        {({getSquares})=>(
          <div className="game-board">
            <div>
              {[0,1,2].map(row=>(
                <div key={row} className="board-row">
                  {[0,1,2].map(col=>(
                    <Square key={col} value={getSquares()} index={col + row * 3} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </PlayerContext.Consumer>
    );
  }
}

class GameInfo extends React.Component {
  static contextType = PlayerContext;
  constructor(props) {
    super(props);
    this.playNotiRegistered = false;
    this.state = {
      stepNumber: 0,
      xIsNext: true
    };
  }

  componentDidMount() {
    if (!this.playNotiRegistered) {
      this.context.registerPlayNoti(()=>this.onPlay());
      this.playNotiRegistered = true;
    }
  }

  onPlay() {
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
    const steps = ctx.getSteps();
    const winner = ctx.getWinner();

    const moves = steps.map((move, step) => {
      const desc = 'Go to move #' + move;
      return (
        <li key={step+1}>
          <button onClick={() => this.jumpTo(step+1)} className={this.state.stepNumber === step + 1 ? "win" : null}>{desc}</button>
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
    // if any player moves, force update whole game
    this.ctx.registerPlayNoti(()=>this.forceUpdate());
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


