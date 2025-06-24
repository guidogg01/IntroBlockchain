// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC1155 is ERC1155, Ownable {
    uint256 private _currentTokenId;
    mapping(uint256 => string) public nombreAlumno;

    constructor()
        ERC1155("https://mi-api.com/metadata/{id}.json")
        Ownable(msg.sender)   // <— Aquí vuelves a pasar msg.sender
    {}

    function nextTokenId() external view returns (uint256) {
        return _currentTokenId;
    }

    function mintNew(
        address to,
        uint256 amount,
        bytes calldata data
    ) external returns (uint256 newId) {
        newId = _currentTokenId++;
        _mint(to, newId, amount, data);
        nombreAlumno[newId] = string(data);
    }
}
