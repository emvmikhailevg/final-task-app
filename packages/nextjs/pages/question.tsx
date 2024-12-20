import React, { useState } from "react";
import Option from "./Option";

// Предполагаем, что у вас есть компонент Option

const QuestionComponent = ({ questionData, onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [submittedEmpty, setSubmittedEmpty] = useState(false);

  const handleVote = () => {
    if (selectedOption === null) {
      setSubmittedEmpty(true);
      return;
    }
    setSubmittedEmpty(false);
    onSubmit(selectedOption);
  };

  return (
    <div className="bg-base-300 p-6 rounded-2xl w-full lg:w-2/3 m-4">
      <h1 className="font-bold text-4xl">{questionData.question}</h1>

      <div className="flex flex-col gap-y-2 mt-4">
        {questionData.optionNames.map((option, i) => (
          <Option index={i} setChecked={index => setSelectedOption(index)} key={i}>
            {option}
          </Option>
        ))}
      </div>

      {submittedEmpty && <p className="text-color text-center">Please select a value!</p>}

      <button
        className="block mx-auto bg-primary mt-4 font-bold text-lg rounded-lg focus:bg-primary-focus text-primary-content px-4 py-2"
        onClick={handleVote}
      >
        Vote!
      </button>
    </div>
  );
};

export default QuestionComponent;
