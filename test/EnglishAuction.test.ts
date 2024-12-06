import {time, loadFixture, anyValue, expect, hre, ethers, SignerWithAddress} from "./setup";
import { EnglishAuction } from "../typechain-types";

describe("EnglishAuction", function() {
  async function deploy() {
    const [owner, other, bidder2, hacker] = await ethers.getSigners();
    const contstructInitializeItems = ["TestItem", 100n];

    const englishAuction = await ethers.deployContract("EnglishAuction", contstructInitializeItems);
    return {englishAuction, owner, other, bidder2, hacker};
  }

  it("should allow to start auction seller only", async function() {
    const {englishAuction,owner,other} = await loadFixture(deploy);

    const txStartAuction = await englishAuction.start();

    expect(await englishAuction.started()).to.be.true;
  });
  it("shouldn't allow to start auction if not seller", async function() {
    const {englishAuction,owner,other} = await loadFixture(deploy);

    const txStartAuction = 

    await expect(englishAuction.connect(other).start()).revertedWith("Not a seller");
  });
  it("shouldn't allow to start auction twice or more", async function() {
    const {englishAuction,owner,other} = await loadFixture(deploy);

    const txStartAuction = await englishAuction.start();

    expect(await englishAuction.started()).to.be.true;
    await expect(englishAuction.start()).revertedWith("Has already started");

  });
  it("shouldn't emit Start event when auction is started", async function() {
    const {englishAuction,owner,other} = await loadFixture(deploy);
    await expect(englishAuction.start()).emit(englishAuction, "Start").withArgs("TestItem",100n);
  });

  it("shouldn't possible to bid if auction is not started yet", async function() {
    const {englishAuction,owner,other} = await loadFixture(deploy);
    await expect(englishAuction.connect(other).bid({value: 1000})).rejectedWith("Has not started yet");
  });

  it("shouldn't possible to bit if bid is too low", async function() {
    const {englishAuction,owner,other} = await loadFixture(deploy);
    const txStartAuction = await englishAuction.start();
    await expect(englishAuction.connect(other).bid({value: 100})).rejectedWith("too low");
  });
  it("should emit Bid event", async function() {
    const {englishAuction,owner,other} = await loadFixture(deploy);
    const txStartAuction = await englishAuction.start();
    const bid = 2000;
    await expect(englishAuction.connect(other).bid({value: bid})).emit(englishAuction, "Bid").withArgs(other.address, bid);
  });

  it("should revert withdraw if incorrect fund amount", async function() {
    const {englishAuction,owner,other, bidder2, hacker} = await loadFixture(deploy);
    const txStartAuction = await englishAuction.start();
    const bid = 2000;
    const bid2 = 3000;

    await expect(englishAuction.connect(other).bid({value: bid})).emit(englishAuction, "Bid").withArgs(other.address, bid);
    await expect(englishAuction.connect(bidder2).bid({value: bid2})).emit(englishAuction, "Bid").withArgs(bidder2.address, bid2);
    await expect(englishAuction.connect(hacker).withdraw()).rejectedWith("incorrect refund amount");
  });

  it("should allow to withdraw if not higher bidder", async function() {
    const {englishAuction,owner,other, bidder2, hacker} = await loadFixture(deploy);
    const txStartAuction = await englishAuction.start();
    const bid = 2000;
    const bid2 = 3000;

    await expect(englishAuction.connect(other).bid({value: bid})).emit(englishAuction, "Bid").withArgs(other.address, bid);
    await expect(englishAuction.connect(bidder2).bid({value: bid2})).emit(englishAuction, "Bid").withArgs(bidder2.address, bid2);
    await expect(englishAuction.connect(other).withdraw()).emit(englishAuction, "Withdraw").withArgs(other.address, bid);
  });
  it("shouldn't end auction if not started yet", async function() {
    const {englishAuction,owner,other, bidder2, hacker} = await loadFixture(deploy);
    await expect(englishAuction.connect(owner).end()).rejectedWith("Has not started yet");
  });

  it("shouldn't end auction if time isn't exeeded", async function() {
    const {englishAuction,owner,other, bidder2, hacker} = await loadFixture(deploy);
    const txStartAuction = await englishAuction.start();
    await expect(englishAuction.connect(owner).end()).rejectedWith("can't stop auction yet");
  });
  it("should emit End event if time exeeded", async function() {
    const {englishAuction,owner,other, bidder2, hacker} = await loadFixture(deploy);
    const txStartAuction = await englishAuction.start();
    const bid = 2000;
    const bid2 = 3000;

    await expect(englishAuction.connect(other).bid({value: bid})).emit(englishAuction, "Bid").withArgs(other.address, bid);
    await expect(englishAuction.connect(bidder2).bid({value: bid2})).emit(englishAuction, "Bid").withArgs(bidder2.address, bid2);

    await time.increase(3600);
    await expect(englishAuction.connect(owner).end()).emit(englishAuction, "End").withArgs(bidder2.address, bid2)
  });
});