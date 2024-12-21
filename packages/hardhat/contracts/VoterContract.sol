// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract YourContract {

    struct Candidate {
        string name;
        uint votes;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    function getWinner() public view returns (uint[] memory) {
        require(candidates.length > 0, "No candidates");
        uint[] memory cLength = new uint[](candidates.length);

        uint winnerVotes = candidates[0].votes;
        // Индекс победителя
        uint winnerIndex = 0;

        for (uint i = 1; i < candidates.length; i++) {
            if (candidates[i].votes > winnerVotes) {
                winnerVotes = candidates[i].votes;
                winnerIndex = i;
            }
        }

        // cLength[0] — количество голосов победителя
        // cLength[1] — индекс победителя
        cLength[0] = winnerVotes;
        cLength[1] = winnerIndex;

        return cLength;
    }

    function addCandidate(string memory _name) public {
        candidates.push(Candidate({name: _name, votes: 0}));
    }

    function getCandidate(uint index) public view returns (Candidate memory) {
        require(index < candidates.length, "Incorrect candidate index");
        return candidates[index];
    }

    function getCandidatesCount() public view returns (uint) {
        return candidates.length;
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function vote(uint index) public {
        require(!hasVoted[msg.sender], "You've already voted");
        require(index < candidates.length, "Incorrect candidate index");
        candidates[index].votes += 1;
        hasVoted[msg.sender] = true;
    }
}
