"use client";

import { useState } from "react";
import { connectWallet, mint, balanceOf } from "@/lib/contract";
import { fetchNFTs, NFTData } from "@/lib/alchemy";
import NFTCard from "@/components/NFTCard";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string>("");  // ← Nuevo estado

  const handleConnect = async () => {
    const address = await connectWallet();
    if (address) {
      setWalletAddress(address);
      setRecipient(address);           // Por defecto mandamos a nuestra propia wallet
      await loadNFTs(address);
      const bal = await balanceOf(address, 0);
      setBalance(bal);
    }
  };

  const loadNFTs = async (address: string) => {
    setLoading(true);
    const fetched = await fetchNFTs(address);
    setNfts(fetched);
    setLoading(false);
  };

  const handleMint = async () => {
    if (!walletAddress) {
      alert("Primero conectá la wallet.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      alert("Dirección inválida.");
      return;
    }
    setLoading(true);
    const success = await mint(recipient, 0, 1);
    if (success) {
      await loadNFTs(walletAddress);
      const bal = await balanceOf(walletAddress, 0);
      setBalance(bal);
    }
    setLoading(false);
  };

  return (
    <main className="bg-[#f0f4f8] min-h-screen py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-[#2c3e50] mb-4">
          Mis NFTs (ID 0): {balance ?? "0"}
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-6 py-3 w-full sm:w-auto font-semibold text-white rounded-lg
                       bg-gradient-to-r from-[#6a11cb] to-[#2575fc]
                       hover:from-[#8e44ad] hover:to-[#2980b9]
                       transition transform hover:-translate-y-1 disabled:opacity-50"
          >
            {walletAddress ? "Wallet Conectada" : "Conectar Wallet"}
          </button>

          {/* Input para la dirección de destino */}
          <input
            type="text"
            placeholder="Dirección destinataria"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="px-4 py-2 w-full sm:w-72 border rounded-lg"
          />
        </div>

        <div className="flex justify-center mb-10">
          <button
            onClick={handleMint}
            disabled={loading || !walletAddress}
            className="px-6 py-3 w-full sm:w-auto font-semibold text-white rounded-lg
                       bg-gradient-to-r from-[#6a11cb] to-[#2575fc]
                       hover:from-[#8e44ad] hover:to-[#2980b9]
                       transition transform hover:-translate-y-1 disabled:opacity-50"
          >
            Generar NFT
          </button>
        </div>

        {loading && (
          <p className="text-center text-gray-500 mb-6">Procesando...</p>
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
