// /lib/contract.ts
import { BrowserProvider, Contract } from "ethers";

const CONTRACT_ADDRESS = "0x1fee62d24daa9fc0a18341b582937be1d837f91d";

const ABI = [
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
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "tokenURI", type: "string" },
    ],
    name: "mintNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export let provider: BrowserProvider;
export let signer: any;
export let contract: Contract;

export async function connectWallet(): Promise<string | null> {
  if (!window.ethereum) {
    alert("Instalá MetaMask para usar esta dApp.");
    return null;
  }

  try {
    provider = new BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
    return await signer.getAddress();
  } catch (error) {
    console.error("Error conectando la wallet:", error);
    return null;
  }
}

export async function getClaseData(tokenId: string) {
  if (!contract) return null;

  try {
    const data = await contract.datosDeClases(tokenId);
    return {
      clase: data.clase.toString(),
      tema: data.tema,
      alumno: data.alumno,
    };
  } catch (error) {
    console.error(`Error leyendo datos del contrato para Token ID ${tokenId}:`, error);
    return null;
  }
}
