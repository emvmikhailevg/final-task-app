"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Candidate {
  name: string;
  votes: bigint;
}

interface Winner {
  winnerIndex: bigint;
  winnerVotes: bigint;
}

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const [newCandidate, setNewCandidate] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);

  const { data: ownerData } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "owner",
  });

  const { data: allCandidatesData, isLoading: isCandidatesLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getAllCandidates",
    watch: true,
  });

  const { data: winnerData, isLoading: isWinnerLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getWinner",
    watch: true,
  });

  const { writeContractAsync: addCandidateAsync, isMining: isAdding } = useScaffoldWriteContract("YourContract");
  const { writeContractAsync: voteAsync, isMining: isVoting } = useScaffoldWriteContract("YourContract");

  useEffect(() => {
    if (allCandidatesData) {
      const fetchedCandidates: Candidate[] = (allCandidatesData as readonly { name: string; votes: bigint }[]).map(
          candidate => ({
            name: candidate.name,
            votes: candidate.votes,
          }),
      );
      setCandidates(fetchedCandidates);
    }
  }, [allCandidatesData]);

  useEffect(() => {
    if (winnerData) {
      const [winnerIndex, winnerVotes] = winnerData as [bigint, bigint];
      setWinner({
        winnerIndex,
        winnerVotes,
      });
    }
  }, [winnerData]);

  const handleAddCandidate = async () => {
    if (!newCandidate) return;
    try {
      await addCandidateAsync({
        functionName: "addCandidate",
        args: [newCandidate],
      });
      setNewCandidate("");
    } catch (e) {
      console.error("Ошибка при добавлении кандидата:", e);
    }
  };

  const handleVote = async () => {
    if (selectedCandidate === null) return;
    try {
      await voteAsync({
        functionName: "vote",
        args: [BigInt(selectedCandidate)],
      });
      setSelectedCandidate(null);
    } catch (e) {
      console.error("Ошибка при голосовании:", e);
    }
  };

  return (
      <>
        <div className="flex flex-col items-center justify-start flex-grow p-8">
          <div className="max-w-xl w-full mb-10">
            <h1 className="text-center text-3xl font-semibold text-blue-700 mb-6">
              Добро пожаловать
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <p className="font-medium text-gray-700">Подключенный адрес:</p>
              <Address address={connectedAddress} />
            </div>
          </div>

          <div className="w-full max-w-md border border-gray-300 rounded-md shadow-lg p-6 bg-white">
            <h2 className="font-bold text-xl text-gray-900 mb-4 text-center">
              Добавить кандидата
            </h2>
            <input
                type="text"
                value={newCandidate}
                onChange={e => setNewCandidate(e.target.value)}
                className="w-full mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 px-3 py-2 text-gray-800"
                placeholder="Имя кандидата"
            />
            <button
                className={`w-full py-2 rounded text-white font-medium transition-colors ${
                    isAdding
                        ? "bg-blue-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={handleAddCandidate}
                disabled={isAdding}
            >
              {isAdding ? "Добавление..." : "Добавить"}
            </button>
          </div>

          <div className="mt-12 w-full max-w-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              Список кандидатов
            </h2>
            {isCandidatesLoading ? (
                <p className="text-center text-gray-600">Загрузка кандидатов...</p>
            ) : candidates.length > 0 ? (
                <ul className="space-y-2">
                  {candidates.map((candidate, index) => (
                      <li
                          key={index}
                          className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-2 bg-white shadow-sm"
                      >
                  <span className="text-gray-800">
                    {index}. {candidate.name} — {candidate.votes.toString()} голосов
                  </span>
                        <button
                            className={`px-3 py-1 rounded font-medium text-white transition-colors ${
                                isVoting && selectedCandidate === index
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                            }`}
                            onClick={() => setSelectedCandidate(index)}
                            disabled={isVoting}
                        >
                          {isVoting && selectedCandidate === index
                              ? "Голосование..."
                              : "Голосовать"}
                        </button>
                      </li>
                  ))}
                </ul>
            ) : (
                <p className="text-center text-gray-600">Кандидатов пока нет.</p>
            )}
            {selectedCandidate !== null && (
                <button
                    className={`mt-4 w-full py-2 rounded text-white font-medium transition-colors ${
                        isVoting ? "bg-yellow-300 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"
                    }`}
                    onClick={handleVote}
                    disabled={isVoting}
                >
                  {isVoting ? "Голосование..." : "Подтвердить выбор"}
                </button>
            )}
          </div>
        </div>
      </>
  );
};

export default Home;
