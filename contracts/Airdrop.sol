// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "./SafeMath.sol";

abstract contract Token is ERC20 {}

contract Airdrop is Ownable {
  using SafeMath for uint;

  address public tokenAddr;

  event EtherTransfer(address beneficiary, uint amount);

  constructor() {}

  function dropTokens(address[] memory _recipients, uint256 _amount) public onlyOwner returns (bool) {
    for (uint i = 0; i < _recipients.length; i++) {
      require(_recipients[i] != address(0));
      require(Token(tokenAddr).transfer(_recipients[i], _amount));
    }

    return true;
  }

  function dropEther(address[] memory _recipients, uint256[] memory _amount) public payable onlyOwner returns (bool) {
    uint total = 0;

    for(uint j = 0; j < _amount.length; j++) {
      total.add(_amount[j]);
    }

    require(total <= msg.value);
    require(_recipients.length == _amount.length);

    for (uint i = 0; i < _recipients.length; i++) {
      require(_recipients[i] != address(0));

      payable(_recipients[i]).transfer(_amount[i]);
      emit EtherTransfer(_recipients[i], _amount[i]);
    }

    return true;
  }

  function setTokenAddress(address _tokenAddr) public onlyOwner {
    tokenAddr = _tokenAddr;
  }

  function withdrawTokens(address beneficiary) public onlyOwner {
    require(Token(tokenAddr).transfer(beneficiary, Token(tokenAddr).balanceOf(address(this))));
  }

  function withdrawEther(address payable beneficiary) public onlyOwner {
    beneficiary.transfer(address(this).balance);
  }
}