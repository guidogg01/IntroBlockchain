// src/lib/contract.ts
import {
  BrowserProvider,
  Contract,
  type JsonRpcSigner,
  type TransactionResponse,
} from "ethers";

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

const ERC1155_CONTRACT_ADDRESS = "0x4CB8FB803f177270831D47fce9bd2D30aC1efBfA";

export const ERC1155_ABI = [

  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // —– getters on-chain —–
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "nombreAlumno",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "tituloAlumno",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "descripcionNFT",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [{ internalType: "address", name: "to", type: "address" }],
    name: "hasPromoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      { internalType: "address", name: "to",            type: "address" },
      { internalType: "uint256", name: "amount",        type: "uint256" },
      { internalType: "bytes",    name: "data",          type: "bytes"   },
      { internalType: "bytes",    name: "titleData",     type: "bytes"   },
      { internalType: "string",   name: "description",   type: "string" },
    ],
    name: "mintNew",
    outputs: [{ internalType: "uint256", name: "newId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      { internalType: "address", name: "to",          type: "address" },
      { internalType: "uint256", name: "amount",      type: "uint256" },
      { internalType: "bytes",   name: "data",        type: "bytes"   },
      { internalType: "bytes",   name: "titleData",   type: "bytes"   },
      { internalType: "string",  name: "description", type: "string" },
    ],
    name: "mintPromotion",
    outputs: [{ internalType: "uint256", name: "newId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "originOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // —– el resto de tu ABI original —–
  {
    inputs: [],
    name: "nextTokenId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "id",      type: "uint256" },
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

  try {
    const ownerOnChain = await erc1155Contract.owner();
    console.log("Owner on-chain:", ownerOnChain);
  } catch (e) {
    console.error("No pude leer owner():", e);
  }

  return await signer.getAddress();
}

export async function getClaseData(tokenId: string) {
  if (!classContract) return null;
  const data = await classContract.datosDeClases(tokenId);
  return {
    clase: data.clase.toString(),
    tema: data.tema,
    descripcion: data.descripcion,
    alumno: data.alumno,
  };
}


export async function getMintDate(tokenId: string): Promise<Date | null> {
  if (!provider) return null;

  const evtContract = new Contract(
    ERC1155_CONTRACT_ADDRESS,
    TRANSFER_SINGLE_EVENT_ABI,
    provider
  );

  const zero = "0x0000000000000000000000000000000000000000";

  const events = await evtContract.queryFilter(
    evtContract.filters.TransferSingle(null, zero, null),
    0,
    "latest"
  ) as any[];

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
  amount: number,
  data: string,
  titleData: string,
  descriptionData: string
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
    data,
    titleData,
    descriptionData,
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

export async function promote(
  to: string,
  amount: number,
  data: string,
  titleData: string,
  descriptionData: string
): Promise<number | null> {
  if (!signer || !erc1155Contract) {
    alert("Conectá tu wallet antes de mintear.");
    return null;
  }
  const nextIdBN = await erc1155Contract.nextTokenId();
  const nextId = Number(nextIdBN);

  const tx: TransactionResponse = await erc1155Contract.mintPromotion(
    to,
    amount,
    data,
    titleData,
    descriptionData,
  );
  alert(`Transacción enviada\nHash: ${tx.hash}\nEspera confirmación...`);
  await tx.wait();
  alert(`Mint exitoso! Token ID: ${nextId}`);
  return nextId;
}