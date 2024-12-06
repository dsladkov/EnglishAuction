// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract EnglishAuction {
  string public item;
  address payable public immutable seller;
  uint256 public endAt;
  bool public started;
  bool public ended;
  uint256 public highestBid;
  address public highestBidder;
  mapping(address bidder => uint256 bid) public bids;

  event Start(string item, uint256 highestBid);
  event Bid(address bidder, uint256 bid);
  event End(address bidder, uint256 bid);
  event Withdraw(address sender, uint amount);

  constructor(string memory _item, uint256 _startBid) {
    item = _item;
    highestBid = _startBid;
    seller = payable(msg.sender);
  }

  modifier onlySeller() {
    require(msg.sender == seller, "Not a seller");
    _;
  }

  modifier hasStarted() {
    require(started, "Has not started yet");
    _;
  }

  modifier notEnded() {
    require(block.timestamp < endAt, "Has ended");
    _;
  }

  function start() external onlySeller {
    require(!started, "Has already started");
    started = true;
    endAt = block.timestamp + 70;
    emit Start(item, highestBid);
  }

  function bid() external payable hasStarted notEnded {
    uint256 prevbid = bids[msg.sender];
    uint256 accumBid = prevbid + msg.value;
    require(accumBid > highestBid, "too low");
    if(highestBidder != address(0)) {
      bids[highestBidder] = highestBid;
    }
    highestBid = accumBid;
    highestBidder = msg.sender;
    emit Bid(msg.sender, accumBid);
  }

  function end() external hasStarted {
    require(!ended, "already ended");
    require(block.timestamp >= endAt, "can't stop auction yet");
    ended = true;
    if(highestBidder != address(0)) {
      seller.transfer(highestBid);
    }
    emit End(highestBidder, highestBid);
  }

  function withdraw() external {
    uint256 refundAmount = bids[msg.sender];
    require(refundAmount > 0, "incorrect refund amount");
    bids[msg.sender] = 0;
    payable(msg.sender).transfer(refundAmount);
    emit Withdraw(msg.sender, refundAmount);
  }
}