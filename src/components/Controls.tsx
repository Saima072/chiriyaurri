import React from 'react';

type ControlsProps = {
  onCorrect: () => void;
  onIncorrect: () => void;
};

const Controls: React.FC<ControlsProps> = ({ onCorrect, onIncorrect }) => {
  return (
    <div>
      <button onClick={onCorrect}>Fly</button>
      <button onClick={onIncorrect}>Stay</button>
    </div>
  );
};

export default Controls;
