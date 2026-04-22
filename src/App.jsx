import './App.css'
import { useState, useEffect, useRef } from 'react'
export default function App() {
  
  const [points, setPoints] = useState(5);
  const [isAuto, setIsAuto] = useState(false);
  const [game, setGame] = useState({circles: [], next:1, time:0 , status: 'init'});
  const timer = useRef(null), boardRef = useRef(null) , autoTick = useRef(0), isAutoRef = useRef(false);

  const start = () => {
    const b = boardRef.current, num = parseInt(points) || 0;
    if(!b || num <= 0) return;
    clearInterval(timer.current);
    setIsAuto(false); isAutoRef.current = false;
    autoTick.current = 0;

    setGame({
      time: 0, status: 'playing', next:1,
      circles: Array.from({ length: num }, (_, i) => ({
        id: i+1, x:Math.random() * (b.clientWidth), y: Math.random() * (b.clientHeight), cooldown:0
      }))
    })

    timer.current = setInterval(() => {
      setGame(g => {
        if(g.status !== 'playing') return g;
        const updated = g.circles.map(c => c.cooldown > 0 ? {...c, cooldown: Math.max(0,c.cooldown-0.1)} : c);
        const won = g.next > g.circles.length && updated.every(c => c.cooldown === 0)

        let nextState = { ...g, time:g.time + 0.1, circles: updated, status: won ? 'won' : g.status};
        if(won) {
          clearInterval(timer.current);
          setIsAuto(false);
          isAutoRef.current = false;
        }

        // Handle AutoPlay
        if(isAutoRef.current && !won) {
          autoTick.current++;
          if(autoTick.current >= 10) {
            autoTick.current = 0;
            const target = updated.find(c => c.id === g.next && c.cooldown === 0);
            if(target) {
              nextState.circles = updated.map(c => c.id === g.next ? { ...c, cooldown: 3.0} : c);
              nextState.next++;
            }
          }
        }
        return nextState;
      })
    }, 100)
  }

  const click = (id) => {
    if(game.status !== 'playing' || isAuto) return;
    
    setGame(g => {
      if(id !== g.next || g.circles.find(c => c.id === id).cooldown > 0) {

        if(id !== g.next) {
          clearInterval(timer.current);
          return {...g, status: 'lost'};
        }

        return g;
      }

      return { ...g , next: g.next +1, circles: g.circles.map(c => c.id === id ? {...c,cooldown:3.0} : c)};
    })
  }

  useEffect(() => () => clearInterval(timer.current), []);

  return (
    <div className="game-container">
      <h1 style={{ color: game.status === 'won' ? 'green' : game.status === 'lost' ? 'red' : '#000'}}>
          {game.status === 'won' ? 'ALL CLEAR' : game.status === 'lost' ? 'GAME OVER' : "LET'S PLAY"}
      </h1>

      <div className="controls">
        <label>Points: <input type="number" value={points} onChange={e => setPoints(e.target.value)} disabled={game.status === 'playing'}/></label>
        <label>Time: <span>{game.time.toFixed(1)}s</span></label>

        <div className="control-row">
          <button onClick={start}>{game.status === 'init' ? "Play" : "Restart"}</button>
          <button onClick={() => {
            if(game.status === 'playing') {
              isAutoRef.current = !isAutoRef.current;
              setIsAuto(isAutoRef.current);
            }
          }}>Auto Play {isAuto ? 'ON' : 'OFF'}</button>
        </div>
      </div>

      <div className="board" ref={boardRef}>
          {game.circles.map(c => (
            <div key={c.id} className="circle" onClick={() => click(c.id)} style={{
              left: c.x, top:c.y, zIndex: game.circles.length - c.id,
              opacity: c.cooldown > 0 ? c.cooldown / 3 : (game.next > c.id ? 0 : 1),
              visibility: game.next > c.id && c.cooldown === 0 ? 'hidden' : 'visible',
              background: c.cooldown > 0 ? 'orange' : '#fff', color: c.cooldown > 0 ? '#fff' : '#000'
            }}>

            <div style= {{display: 'flex', flexDirection: 'column' , alignItems: 'center'}}>
              <b style={{fontSize: c.cooldown > 0 ? '12px' : '18px'}}>{c.id}</b>
              {c.cooldown > 0 && <small style={{fontSize: '10px'}}>{c.cooldown.toFixed(1)}s</small>}
            </div>  
          
            </div>))}
      </div>
      {game.status === 'playing' && game.next <= game.circles.length && <div className='footer'>Next: {game.next}</div>}
    </div>
  )
}
