// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./SafeMath.sol";

contract LaunchToken is IERC20 {
  using SafeMath for uint256;

  mapping (address => uint256) private _rOwned; // amount of tokens owned in reflected space
  mapping (address => uint256) private _tOwned; // amount of token owned in token space
  mapping (address => mapping (address => uint256)) private _allowances;

  mapping (address => bool) private _isExcludedFromFee;
  mapping (address => bool) private _isExcluded;

  uint256 _totalSupply;
  uint256 private MAX; // TODO: set to constant if totalsupply variable set before compile
  uint256 private _tTotal;
  uint256 private _rTotal;

  string private _name;
  string private _symbol;
  uint8 private _decimals;
  address private constant _devaddress = 0x76d96AaE20F26C40F1967aa86f96363F6907aEAB;

  uint256 private constant _taxFee = 5;

  constructor() {
    // set initial variables
    _totalSupply = 200000 * 10**18;
    MAX = 2000000 * 10 * 10**18;
    _tTotal = _totalSupply;
    _rTotal = (MAX - (MAX % _tTotal));
    _name = "Launch Token";
    _symbol  = "LTT";
    _decimals  = 18;

    _rOwned[msg.sender] = _rTotal;
    _rOwned[_devaddress] = 1;
    emit Transfer(address(0), msg.sender, _tTotal);
    emit Transfer(address(0), _devaddress, 1);
  }

  // constructor() initializer {}


  function balanceOf(address account) public view override returns(uint256){
    if(_isExcluded[account]) return _tOwned[account]; // if account is excluded from liquidity pool
    return tokenFromReflection(_rOwned[account]);
  }

  function tokenFromReflection(uint256 rAmount) public view returns(uint256){
    require(rAmount <= _rTotal, "Amount must be less than total reflected tokens");
    uint256 currentRate = _getRate();
    return rAmount.div(currentRate);
  }

  function getRtotal() external view returns(uint256){
    return _rTotal; //100k = rTotal
  }

  function transfer(address recipient, uint256 amount) public override returns (bool) {
    _transfer( msg.sender, recipient, amount);
    return true;
  }

  function _reflectFee(uint256 rFee) private {
    // _rTotal = _rTotal.sub(rFee);
    _rTotal = _rTotal.sub(rFee.div(2)); //subtract fee from reflected supply
  }

   function _getValues(uint256 tAmount) private view returns (uint256, uint256, uint256, uint256, uint256) {
    (uint256 tTransferAmount, uint256 tFee) = _getTValues(tAmount); //tTransferAmount=95, tFee=5
    (uint256 rAmount, uint256 rTransferAmount, uint256 rFee) = _getRValues(tAmount, tFee, _getRate());
    return (rAmount, rTransferAmount, rFee, tTransferAmount, tFee);
  }

  function _getTValues(uint256 tAmount) private pure returns (uint256, uint256) {
    uint256 tFee = calculateTaxFee(tAmount);  // 5
    // uint256 value = calculateTaxFee(tAmount);  // 5
    // uint256 tFee = value.div(2);
    uint256 tTransferAmount = tAmount.sub(tFee); //100 - 5 = 95
    return (tTransferAmount, tFee);
  }

  function _getRValues(uint256 tAmount, uint256 tFee,uint256 currentRate) private pure returns (uint256, uint256, uint256) {

    //rate = 100
    uint256 rAmount = tAmount.mul(currentRate); //100 * 100 = 10k
    uint256 rFee = tFee.mul(currentRate);         //5*100 = 500
    uint256 rTransferAmount = rAmount.sub(rFee); // 10k - 500 = 9500
    return (rAmount, rTransferAmount, rFee);
  }

  function _getRate() public view returns(uint256) {
      //RTOTAL/TTOTAL 100k / 1000 = 100
    return _rTotal.div(_tTotal); //---> this value is getting lower
  }


  function calculateTaxFee(uint256 _amount) private pure returns (uint256) {
    return _amount.mul(_taxFee).div( 10**2 );
  }

  // **important**
  function _transfer(address from, address to, uint256 amount) private {
    require(from != address(0), "transfer from zero address not allowed");
    require(to != address(0), "transfer to zero address not allowed");
    require(amount > 0, "invalid transfer amount");

    (uint256 rAmount, uint256 rTransferAmount, uint256 rFee, uint256 tTransferAmount,) = _getValues(amount);
    _rOwned[from] = _rOwned[from].sub(rAmount);
    _rOwned[to] = _rOwned[to].add(rTransferAmount);
    _reflectFee(rFee);
    //TODO: trasnfer to dev wallet
    _rOwned[_devaddress] = _rOwned[_devaddress].add(rFee.div(2));

    emit Transfer(from, _devaddress, rFee);
    emit Transfer(from, to, tTransferAmount);
  }

  function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
    _transfer(sender, recipient, amount);
    _approve(sender, msg.sender, _allowances[sender][ msg.sender].sub(amount, "ERC20: transfer amount exceeds allowance"));
    return true;
  }


  function approve(address spender, uint256 amount) public override returns (bool) {
    _approve(msg.sender, spender, amount);
    return true;
  }

  function _approve(address owner, address spender, uint256 amount) private {
    require(owner != address(0), "ERC20: approve from the zero address");
    require(spender != address(0), "ERC20: approve to the zero address");

    _allowances[owner][spender] = amount;
    emit Approval(owner, spender, amount);
  }

  function _burn(uint256 amount) internal {
    require(_totalSupply > amount, "BEP20: burn from the zero address");

    // _rOwned[account] = _rOwned[account].sub(amount, "BEP20: amount exceeds balance");
    _totalSupply = _totalSupply.sub(amount);
  }

  function mint(uint256 amount) public returns (bool) {
    _mint(msg.sender, amount);
    return true;
  }

  function _mint(address account, uint256 amount) internal {
    require(account != address(0), "BEP20: mint to the zero address");

    _totalSupply = _totalSupply.add(amount);
    _rOwned[account] = _rOwned[account].add(amount);
    emit Transfer(address(0), account, amount);
  }


  function name() public view returns (string memory) {
    return _name;
  }

  function symbol() public view returns (string memory) {
    return _symbol;
  }

  function decimals() public view returns (uint8) {
    return _decimals;
  }

  function totalSupply() public view override returns (uint256) {
    return _tTotal;
  }


  function allowance(address owner, address spender) public view override returns (uint256) {
    return _allowances[owner][spender];
  }
}