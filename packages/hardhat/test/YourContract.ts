import { expect } from "chai";
import { ethers } from "hardhat";
import { VoterContract } from "../typechain-types";

describe("YourContract", function () {
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
    it("Должен установить правильного владельца (proprietor)", async function () {
      expect(await voterContract.proprietor()).to.equal(owner.address);
    });

    it("Изначально список кандидатов должен быть пуст", async function () {
      expect(await voterContract.getCandidatesCount()).to.equal(0);
    });
  });

  describe("Adding Candidates", function () {
    it("Владелец может добавлять кандидатов", async function () {
      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");
      expect(await voterContract.getCandidatesCount()).to.equal(2);
    });

    it("Посторонний пользователь не может добавлять кандидатов", async function () {
      await expect(voterContract.connect(addr1).addCandidate("Charlie")).to.be.revertedWith("Not the proprietor");
    });
  });

  describe("Getting Candidates", function () {
    it("Может получить данные о кандидате по индексу", async function () {
      const candidate = await voterContract.getCandidate(0);
      expect(candidate.name).to.equal("Alice");
      expect(candidate.votes).to.equal(0);
    });

    it("Не может получить данные о кандидате по несуществующему индексу", async function () {
      const count = await voterContract.getCandidatesCount();
      await expect(voterContract.getCandidate(count)).to.be.revertedWith("Incorrect proprietor index");
    });
  });

  describe("Voting", function () {
    before(async function () {
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();

      // Добавляем кандидатов
      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");
    });

    it("Позволяет проголосовать за существующего кандидата", async function () {
      await voterContract.connect(addr1).vote(0); // Голос за Alice
      const candidate = await voterContract.getCandidate(0);
      expect(candidate.votes).to.equal(1);
    });

    it("Не должно позволять голосовать повторно с одного адреса", async function () {
      await expect(voterContract.connect(addr1).vote(1)).to.be.revertedWith("You've already voted");
    });

    it("Не должно позволять голосовать за несуществующего кандидата", async function () {
      const count = await voterContract.getCandidatesCount();
      await expect(voterContract.connect(addr2).vote(count)).to.be.revertedWith("Incorrect proprietor index");
    });
  });

  describe("Determining the Winner", function () {
    before(async function () {
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();
    });

    it("Должен ревертить getWinner, если нет кандидатов", async function () {
      await expect(voterContract.getWinner()).to.be.revertedWith("No candidates");
    });

    it("Должен корректно возвращать победителя при наличии кандидатов (если второй превзошел первого)", async function () {
      // Новый деплой для этого теста
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();

      // Добавляем двух кандидатов: Alice (0), Bob (1)
      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");

      // Голосуем только за Bob, чтобы Bob превзошёл Alice
      // Изначально Alice:0, Bob:0. Дадим Bob один голос
      await voterContract.connect(addr1).vote(1); // Bob:1, Alice:0

      const winner = await voterContract.getWinner();
      // Bob превзошёл Alice, winner: [1,1]
      expect(winner[0]).to.equal(1);
      expect(winner[1]).to.equal(1);
    });

    it("При ничьей ни один кандидат не превосходит первого, значит результат [0,0]", async function () {
      // Новый деплой для проверки ничьи
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      voterContract = (await yourContractFactory.deploy(owner.address)) as VoterContract;
      await voterContract.waitForDeployment();

      await voterContract.addCandidate("Alice");
      await voterContract.addCandidate("Bob");

      // Создаем ничью: Alice:1, Bob:1
      await voterContract.connect(addr1).vote(0); // Alice:1
      await voterContract.connect(addr2).vote(1); // Bob:1

      const winner = await voterContract.getWinner();
      // Никто не превзошел Alice, значит [0,0]
      expect(winner[0]).to.equal(0);
      expect(winner[1]).to.equal(0);
    });
  });
});
