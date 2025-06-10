// src/lib/contract.ts
import {
  BrowserProvider,
  Contract,
  type JsonRpcSigner,
  type BigNumberish,
  type TransactionResponse,
} from "ethers";

//
// 1) Contrato original (datosDeClases)
//
const CLASS_CONTRACT_ADDRESS = "0x1fee62d24daa9fc0a18341b582937be1d837f91d";
const CLASS_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "datosDeClases",
    outputs: [
      { internalType: "uint256", name: "clase", type: "uint256" },
      { internalType: "string", name: "tema", type: "string" },
      { internalType: "address", name: "alumno", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

//
// 2) Tu ERC-1155 desplegado con nextTokenId + mintNew
//
const ERC1155_CONTRACT_ADDRESS = "0xe3Dc6ab415D10a1B8bd817057B0Dd58396d37F55";
const ERC1155_ABI = [
  {
    inputs: [],
    name: "nextTokenId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "mintNew",
    outputs: [{ internalType: "uint256", name: "newId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "uri",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

export let provider: BrowserProvider;
export let signer: JsonRpcSigner;
export let classContract: Contract;
export let erc1155Contract: Contract;

export async function connectWallet(): Promise<string | null> {
  if (!window.ethereum) {
    alert("Instalá MetaMask para usar esta dApp.");
    return null;
  }

  provider = new BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  classContract = new Contract(CLASS_CONTRACT_ADDRESS, CLASS_ABI, signer);
  erc1155Contract = new Contract(
    ERC1155_CONTRACT_ADDRESS,
    ERC1155_ABI,
    signer
  );

  return await signer.getAddress();
}

export async function getClaseData(tokenId: string) {
  if (!classContract) return null;
  const data = await classContract.datosDeClases(tokenId);
  return {
    clase: data.clase.toString(),
    tema: data.tema,
    alumno: data.alumno,
  };
}

/**
 * Mintea un NFT con ID incremental, leyendo antes nextTokenId.
 * Ahora también muestra el hash de la tx en una alerta.
 * @returns newId si minteó OK, o null si falló.
 */
export async function mint(
  to: string,
  amount: number = 1,
  data: string = "0x"
): Promise<number | null> {
  if (!signer || !erc1155Contract) {
    alert("Conectá tu wallet antes de mintear.");
    return null;
  }

  // 1) leo el próximo ID
  const nextIdBN = await erc1155Contract.nextTokenId();
  const nextId = Number(nextIdBN);

  // 2) lanzo la tx y muestro su hash
  const tx: TransactionResponse = await erc1155Contract.mintNew(
    to,
    amount,
    data
  );
  alert(`Transacción enviada\nHash: ${tx.hash}\nEspera confirmación...`);

  // 3) espero la confirmación
  await tx.wait();

  alert(`Mint exitoso! Token ID: ${nextId}`);
  return nextId;
}

export async function balanceOf(
  account: string,
  id: number = 0
): Promise<string | null> {
  if (!erc1155Contract) return null;
  const balBN = await erc1155Contract.balanceOf(account, id);
  return balBN.toString();
}
