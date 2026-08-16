const sortEntriesDescending = (entries) => {
    return [...entries].sort((left, right) => {
        if (right[1] !== left[1]) {
            return right[1] - left[1];
        }

        return left[0].localeCompare(right[0], "pt-BR");
    });
};

export const recommendFromAnswers = ({ answers, questions, paths }) => {
    const scoreMap = new Map(paths.map((path) => [path.id, 0]));
    const chosenOptions = [];

    questions.forEach((question) => {
        const selectedValue = answers.get(question.id);

        if (!selectedValue) {
            return;
        }

        const selectedOption = question.options.find((option) => option.value === selectedValue);

        if (!selectedOption) {
            return;
        }

        chosenOptions.push({
            question: question.title,
            label: selectedOption.label,
            description: selectedOption.description
        });

        Object.entries(selectedOption.scores || {}).forEach(([pathId, score]) => {
            scoreMap.set(pathId, (scoreMap.get(pathId) || 0) + score);
        });
    });

    const rankedPaths = sortEntriesDescending(scoreMap.entries());
    const bestPath = paths.find((path) => path.id === rankedPaths[0]?.[0]) || paths[0];
    const runnerUp = paths.find((path) => path.id === rankedPaths[1]?.[0]) || null;

    return {
        bestPath,
        runnerUp,
        chosenOptions,
        scoreMap
    };
};
