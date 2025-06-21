// src/lib/contract.ts
import {
  BrowserProvider,
  Contract,
  type JsonRpcSigner,
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
// 2) Tu ERC-1155 desplegado con nextTokenId + mintNew + balanceOf
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

//
// 3) ABI solo para el evento TransferSingle
//
const TRANSFER_SINGLE_EVENT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "operator", type: "address" },
      { indexed: true, internalType: "address", name: "from",     type: "address" },
      { indexed: true, internalType: "address", name: "to",       type: "address" },
      { indexed: false, internalType: "uint256", name: "id",       type: "uint256" },
      { indexed: false, internalType: "uint256", name: "value",    type: "uint256" },
    ],
    name: "TransferSingle",
    type: "event",
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
  erc1155Contract = new Contract(ERC1155_CONTRACT_ADDRESS, ERC1155_ABI, signer);

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
 * Obtiene la fecha de minteo (TransferSingle from=zero) de un token ERC-1155.
 */
export async function getMintDate(tokenId: string): Promise<Date | null> {
  if (!provider) return null;

  // Creamos un contrato ligero sólo con el ABI del evento
  const evtContract = new Contract(
    ERC1155_CONTRACT_ADDRESS,
    TRANSFER_SINGLE_EVENT_ABI,
    provider
  );

  const zero = "0x0000000000000000000000000000000000000000";

  // Traemos todos los TransferSingle desde el block 0
  const events = await evtContract.queryFilter(
    evtContract.filters.TransferSingle(null, zero, null),
    0,
    "latest"
  ) as any[];

  // Buscamos el primero que coincida con nuestro tokenId
  const ev = events.find(e => {
    const idArg = e.args?.id;
    const num = typeof idArg.toNumber === "function"
      ? idArg.toNumber()
      : Number(idArg);
    return num.toString() === tokenId.toString();
  });
  if (!ev) return null;

  const blk = await provider.getBlock(ev.blockNumber);
  if (!blk) return null;

  return new Date(blk.timestamp * 1000);
}

export async function mint(
  to: string,
  amount: number = 1,
  data: string = "0x"
): Promise<number | null> {
  if (!signer || !erc1155Contract) {
    alert("Conectá tu wallet antes de mintear.");
    return null;
  }
  const nextIdBN = await erc1155Contract.nextTokenId();
  const nextId = Number(nextIdBN);

  const tx: TransactionResponse = await erc1155Contract.mintNew(
    to,
    amount,
    data
  );
  alert(`Transacción enviada\nHash: ${tx.hash}\nEspera confirmación...`);
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
