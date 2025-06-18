// src/lib/alchemy.ts
import { getClaseData } from "@/lib/contract";

const ALCHEMY_API_KEY = "q2OMV1bxwiDJvKqiCFs_bHRabaQcos8E";
const ALCHEMY_BASE_URL = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

export interface NFTData {
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  contractAddress: string;
  tema: string;     // agregado
  alumno: string;   // agregado
}

export async function fetchNFTs(address: string): Promise<NFTData[]> {
  try {
    const url = `${ALCHEMY_BASE_URL}/getNFTs?owner=${address}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.ownedNfts || data.ownedNfts.length === 0) return [];

    // Mapeamos los NFTs básicos
    const nftList: NFTData[] = data.ownedNfts.map((nft: any) => ({
      tokenId: parseInt(nft.id?.tokenId ?? "0", 16).toString(),
      name: nft.title || nft.metadata?.name || "Sin nombre",
      description: nft.description || nft.metadata?.description || "Sin descripción",
      imageUrl: nft.media?.[0]?.gateway || "",
      contractAddress: nft.contract?.address || "No disponible",
      tema: "",    // inicializamos vacío
      alumno: "",  // inicializamos vacío
    }));

    // Para los NFTs del profesor, rellenamos tema y alumno desde el contrato
    await Promise.all(
      nftList.map(async (nft) => {
        if (nft.contractAddress.toLowerCase() ===
            "0x1fee62d24daa9fc0a18341b582937be1d837f91d") {
          const claseData = await getClaseData(nft.tokenId);
          if (claseData) {
            nft.tema = claseData.tema;
            nft.alumno = claseData.alumno;
          }
        }
      })
    );

    return nftList;
  } catch (error) {
    console.error("Error al obtener NFTs:", error);
    return [];
  }
}
