import { expect } from "chai";
import { ethers } from "hardhat";
import { VoterContract } from "../typechain-types";

describe("VoterContract", function () {
  let voterContract: VoterContract;
  let owner: any;
  let addr1: any;
  let addr2: any;

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const yourContractFactory = await ethers.getContractFactory("YourContract");
    voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
    await voterContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Должен установить правильного владельца", async function () {
      expect(await voterContract.owner()).to.equal(owner.address);
    });

    it("Изначально список кандидатов должен быть пуст", async function () {
      expect(await voterContract.getCandidatesCount()).to.equal(0);
    });

    it("Голосование должно быть активным после деплоя", async function () {
      expect(await voterContract.votingActive()).to.equal(true);
    });
  });

  describe("Adding Candidates", function () {
    it("Владелец может добавлять кандидатов", async function () {
      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");
      expect(await voterContract.getCandidatesCount()).to.equal(2);
    });

    it("Посторонний пользователь не может добавлять кандидатов", async function () {
      await expect(voterContract.connect(addr1).addCandidate("Charlie")).to.be.revertedWith("Not the Owner");
    });
  });

  // В этом блоке мы слегка меняем порядок тестов
  describe("Voting", function () {
    before(async function () {
      // Разворачиваем новый контракт для чистой среды тестирования
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();

      // Добавляем кандидатов
      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");
    });

    it("Не должно позволять голосовать за несуществующего кандидата", async function () {
      await expect(voterContract.connect(addr1).vote(5)).to.be.revertedWith("Invalid candidate index");
    });

    it("Позволяет проголосовать за существующего кандидата", async function () {
      await voterContract.connect(addr1).vote(0); // Голос за Alice
      const candidate = await voterContract.getCandidate(0);
      expect(candidate.votes).to.equal(1);
    });

    it("Не должно позволять голосовать повторно", async function () {
      await expect(voterContract.connect(addr1).vote(1)).to.be.revertedWith("You have already voted");
    });

    it("Не должно позволять голосовать после завершения голосования", async function () {
      await voterContract.endVoting();
      await expect(voterContract.connect(addr2).vote(1)).to.be.revertedWith("Voting has ended");
    });
  });

  describe("Ending Voting", function () {
    before(async function () {
      // Новый контракт для каждого блока тестов
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();
      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");
    });

    it("Владелец может завершить голосование", async function () {
      await voterContract.endVoting();
      expect(await voterContract.votingActive()).to.equal(false);
    });

    it("Посторонний пользователь не может завершить голосование", async function () {
      await expect(voterContract.connect(addr1).endVoting()).to.be.revertedWith("Not the Owner");
    });

    it("Нельзя завершать голосование повторно", async function () {
      // Уже завершено в предыдущем тесте
      await expect(voterContract.endVoting()).to.be.revertedWith("Voting is already ended");
    });
  });

  describe("Determining Winner", function () {
    before(async function () {
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();
      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");
      await voterContract.addCandidate("Charlie");

      // Голосуем
      await voterContract.connect(addr1).vote(0); // Alice: 1
      await voterContract.connect(addr2).vote(1); // Bob: 1
      await voterContract.connect(owner).vote(2); // Charlie: 1
      // Завершаем голосование
      await voterContract.endVoting();
    });

    it("Должен вернуть правильного победителя после окончания голосования", async function () {
      const winner = await voterContract.getWinner();
      // При равенстве голосов выбирается первый по списку кандидат с макс. количеством голосов
      expect(winner.winnerIndex).to.equal(0); // Alice
      expect(winner.winnerVotes).to.equal(1);
    });

    it("При ничьей должен вернуть первого кандидата с максимальным количеством голосов", async function () {
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();

      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");

      await voterContract.connect(addr1).vote(0); // Alice: 1
      await voterContract.connect(addr2).vote(1); // Bob: 1
      await voterContract.endVoting();
      const winner = await voterContract.getWinner();
      expect(winner.winnerIndex).to.equal(0); // Alice
      expect(winner.winnerVotes).to.equal(1);
    });

    it("Не должно позволять узнать победителя до завершения голосования", async function () {
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();

      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");
      await voterContract.connect(addr1).vote(0);
      await voterContract.connect(addr2).vote(1);

      // Голосование еще активно
      await expect(voterContract.getWinner()).to.be.revertedWith("Voting is still active");
    });
  });
});
