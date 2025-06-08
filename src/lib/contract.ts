// /src/lib/contract.ts
import { BrowserProvider, Contract } from "ethers";

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
// 2) Contrato ERC-1155 nuevo (mint, uri, balanceOf)
//
const ERC1155_CONTRACT_ADDRESS = "0x208603Eba86e5C92C64B8460a9D67e001C2ff433";
const ERC1155_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "uri",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
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
];

export let provider: BrowserProvider;
export let signer: any;
export let classContract: Contract;     // para datosDeClases
export let erc1155Contract: Contract;   // para mint, uri, balanceOf

export async function connectWallet(): Promise<string | null> {
  if (!window.ethereum) {
    alert("Instalá MetaMask para usar esta dApp.");
    return null;
  }
  try {
    provider = new BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    // instancia para datosDeClases
    classContract = new Contract(CLASS_CONTRACT_ADDRESS, CLASS_ABI, signer);
    // instancia para ERC-1155
    erc1155Contract = new Contract(
      ERC1155_CONTRACT_ADDRESS,
      ERC1155_ABI,
      signer
    );

    return await signer.getAddress();
  } catch (error) {
    console.error("Error conectando la wallet:", error);
    return null;
  }
}

/** Sigue funcionando igual que antes */
export async function getClaseData(tokenId: string) {
  if (!classContract) return null;
  try {
    const data = await classContract.datosDeClases(tokenId);
    return {
      clase: data.clase.toString(),
      tema: data.tema,
      alumno: data.alumno,
    };
  } catch (error) {
    console.error(
      `Error leyendo datos del contrato de clases para Token ID ${tokenId}:`,
      error
    );
    return null;
  }
}

/** Nuevo mint sobre tu ERC-1155 */
export async function mint(
  to: string,
  id: number = 0,
  amount: number = 1,
  data: string = "0x"
): Promise<boolean> {
  if (!signer || !erc1155Contract) {
    alert("Conectá tu wallet antes de mintear.");
    return false;
  }
  try {
    const tx = await erc1155Contract.mint(to, id, amount, data);
    alert("Transacción enviada. Esperá la confirmación.");
    await tx.wait();
    alert(`Mint exitoso: id=${id}, cantidad=${amount} enviada a ${to}`);
    return true;
  } catch (error) {
    console.error("Error en mint:", error);
    alert("Error al mintear. Revisá la consola para más detalles.");
    return false;
  }
}

/** Balance de ERC-1155 */
export async function balanceOf(
  account: string,
  id: number = 0
): Promise<string | null> {
  if (!erc1155Contract) return null;
  try {
    const bal = await erc1155Contract.balanceOf(account, id);
    return bal.toString();
  } catch (error) {
    console.error("Error obteniendo balance:", error);
    return null;
  }
}
