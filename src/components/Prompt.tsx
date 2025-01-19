import React from 'react';

type PromptProps = {
  prompt: string;
};

const Prompt: React.FC<PromptProps> = ({ prompt }) => {
  return <h3>{prompt}</h3>;
};

export default Prompt;
