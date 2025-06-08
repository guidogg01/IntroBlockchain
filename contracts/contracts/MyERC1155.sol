// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mi colección ERC-1155 de prueba
contract MyERC1155 is ERC1155, Ownable {
    uint256 public constant ITEM = 0;

    /// @notice Llama al constructor de ERC1155 y pasa msg.sender como propietario de Ownable
    constructor()
        ERC1155("https://mi-api.com/metadata/{id}.json")
        Ownable(msg.sender)
    {
        // nada más aquí
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external onlyOwner {
        _mint(to, id, amount, data);
    }
}
