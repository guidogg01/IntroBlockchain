const ALCHEMY_API_KEY = "q2OMV1bxwiDJvKqiCFs_bHRabaQcos8E";
const ALCHEMY_BASE_URL = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

export interface NFTData {
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  contractAddress: string;
}

export async function fetchNFTs(address: string): Promise<NFTData[]> {
  try {
    const response = await fetch(`${ALCHEMY_BASE_URL}/getNFTs/?owner=${address}`);
    const data = await response.json();

    if (!data.ownedNfts || data.ownedNfts.length === 0) return [];

    const nftList: NFTData[] = data.ownedNfts.map((nft: any) => ({
      tokenId: parseInt(nft.id?.tokenId ?? "0", 16).toString(),
      name: nft.title || nft.metadata?.name || "Sin nombre",
      description: nft.description || nft.metadata?.description || "Sin descripción",
      imageUrl: nft.media?.[0]?.gateway || "",
      contractAddress: nft.contract?.address || "No disponible",
    }));

    return nftList;
  } catch (error) {
    console.error("Error al obtener NFTs:", error);
    return [];
  }
}
