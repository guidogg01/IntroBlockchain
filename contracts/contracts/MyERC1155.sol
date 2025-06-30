// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC1155 is ERC1155, Ownable {
    uint256 private _currentTokenId;
    mapping(uint256 => string) private _nombreAlumno;
    mapping(uint256 => string) private _tituloAlumno;
    mapping(uint256 => string) private _descripciones;
    mapping(uint256 => address) private _origin;
    mapping(address => bool) public hasPromoted;

    constructor()
        ERC1155("https://mi-api.com/metadata/{id}.json")
        Ownable(msg.sender)
    {}

    function nextTokenId() external view returns (uint256) {
        return _currentTokenId;
    }

    function descripcionNFT(uint256 tokenId) external view returns (string memory) {
      return _descripciones[tokenId];
    }

    function nombreAlumno(uint256 tokenId) external view returns (string memory) {
      return _nombreAlumno[tokenId];
    }

    function tituloAlumno(uint256 tokenId) external view returns (string memory) {
      return _tituloAlumno[tokenId];
    }

    function originOf(uint256 tokenId) external view returns (address) {
        return _origin[tokenId];
    }

    function mintNew(
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata titleData,
        string calldata description
    )
        external
        returns (uint256 newId)
    {
        newId = _currentTokenId++;
        _mint(to, newId, amount, abi.encodePacked(data, titleData));

        _nombreAlumno[newId]  = string(data);
        _tituloAlumno[newId]  = string(titleData);
        _descripciones[newId] = description;
        _origin[newId]       = to;
    }

    function mintPromotion(
        address to,
        uint256 amount,
        bytes calldata data,
        bytes calldata titleData,
        string calldata description
    ) external onlyOwner returns (uint256 newId) {
        require(!hasPromoted[to], "Ya se uso la promocion para esta wallet");
        newId = _currentTokenId++;
        _mint(to, newId, amount, abi.encodePacked(data, titleData));
        _nombreAlumno[newId]  = string(data);
        _tituloAlumno[newId]  = string(titleData);
        _descripciones[newId] = description;
        _origin[newId]       = to;
        hasPromoted[to] = true;
    }
}
