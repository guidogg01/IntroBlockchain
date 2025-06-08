"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/contract";
import { fetchNFTs, NFTData } from "@/lib/alchemy";
import NFTCard from "@/components/NFTCard";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      setWalletAddress(address);
      alert(`Wallet conectada: ${address}`);
      await loadNFTs(address);
    }
  };

  const loadNFTs = async (address: string) => {
    setLoading(true);
    const fetched = await fetchNFTs(address);
    setNfts(fetched);
    setLoading(false);
  };

  return (
    <main className="bg-[#f0f4f8] min-h-screen py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-[#2c3e50] mb-10">
          Mis NFTs
        </h1>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
          <button
            onClick={handleConnect}
            className="px-6 py-3 w-full sm:w-auto font-semibold text-white rounded-lg bg-gradient-to-r from-[#6a11cb] to-[#2575fc] hover:from-[#8e44ad] hover:to-[#2980b9] transition transform hover:-translate-y-1"
          >
            Conectar Wallet
          </button>

          <button
            onClick={() => alert("Función mintear aún no implementada")}
            className="px-6 py-3 w-full sm:w-auto font-semibold text-white rounded-lg bg-gradient-to-r from-[#6a11cb] to-[#2575fc] hover:from-[#8e44ad] hover:to-[#2980b9] transition transform hover:-translate-y-1"
          >
            Generar NFT
          </button>
        </div>

        {loading && (
          <p className="text-center text-gray-500 mb-6">Cargando NFTs...</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {nfts.length > 0 ? (
            nfts.map((nft) => <NFTCard key={nft.tokenId} nft={nft} />)
          ) : (
            !loading && (
              <p className="text-center text-gray-400 col-span-full">
                No se encontraron NFTs para esta wallet.
              </p>
            )
          )}
        </div>
      </div>
    </main>
  );
}
