import React, { useEffect } from 'react';
import Game from './components/Game';

const App: React.FC = () => {
  useEffect(() => {
    // Create flying objects dynamically
    const createFlyingObject = () => {
      const flyingObject = document.createElement('div');
      flyingObject.classList.add('flying-object');
      flyingObject.style.top = `${Math.random() * 100}vh`;
      flyingObject.style.left = `${Math.random() * 100}vw`;
      document.body.appendChild(flyingObject);

      // Remove flying object after animation
      setTimeout(() => {
        flyingObject.remove();
      }, 9000); // Duration should match the animation duration
    };

    // Create flying objects every 1 second
    const interval = setInterval(createFlyingObject, 600);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h1>Chirya Urri Game</h1>
      <Game />
    </div>
  );
};

export default App;
