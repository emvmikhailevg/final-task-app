// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract YourContract {

    address public proprietor;

    struct Candidate {
        string name;
        uint votes;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    constructor(address _proprietor) {
        proprietor = _proprietor;
    }

    function getWinner() public view returns (uint[] memory) {
        require(candidates.length > 0, "No candidates");
        uint[] memory cLength = new uint[](candidates.length);
        uint winnerVotes = candidates[0].votes;
        for (uint i = 1; i < candidates.length; i++) {
            if (candidates[i].votes > winnerVotes) {
                cLength[0] =  candidates[i].votes;
                cLength[1] = i;
            }
        }

        return cLength;
    }

    function addCandidate(string memory _name) public onlyOwner {
        candidates.push(Candidate({name: _name, votes: 0}));
    }

    modifier onlyOwner() {
        require(msg.sender == proprietor, "Not the proprietor");
        _;
    }

    function getCandidate(uint index) public view returns (Candidate memory) {
        require(index < candidates.length, "Incorrect proprietor index");
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
        require(index < candidates.length, "Incorrect proprietor index");
        candidates[index].votes += 1;
        hasVoted[msg.sender] = true;
    }

}
