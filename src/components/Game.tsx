import React, { useState } from 'react';
import Prompt from './Prompt';
import Controls from './Controls';
import { answers } from '../data/answers';

const Game: React.FC = () => {
  const [score, setScore] = useState<number>(0);
  const [prompt, setPrompt] = useState<string>(answers[0].prompt);

  const handleFly = () => {
    const currentPrompt = answers.find((p) => p.prompt === prompt);
    if (currentPrompt?.correctAction === 'fly') {
      setScore((prevScore) => prevScore + 1);
    } else {
      setScore((prevScore) => prevScore - 1);
    }
    generateNewPrompt();
  };

  const handleStay = () => {
    const currentPrompt = answers.find(
      (p: { prompt: string }) => p.prompt === prompt
    );
    if (currentPrompt?.correctAction === 'stay') {
      setScore((prevScore) => prevScore + 1);
    } else {
      setScore((prevScore) => prevScore - 1);
    }
    generateNewPrompt();
  };

  const generateNewPrompt = () => {
    const randomPrompt =
      answers[Math.floor(Math.random() * answers.length)].prompt;
    setPrompt(randomPrompt);
  };

  return (
    <div>
      <h2>Score: {score}</h2>
      <Prompt prompt={prompt} />
      <Controls onCorrect={handleFly} onIncorrect={handleStay} />
    </div>
  );
};

export default Game;
