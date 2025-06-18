"use client";

import { useState } from "react";
import { connectWallet, mint, balanceOf, provider } from "@/lib/contract";
import { fetchNFTs, NFTData } from "@/lib/alchemy";
import NFTCard from "@/components/NFTCard";
import Loadings from "@/components/Loading";
import { Contract } from "ethers";

const PROFESSOR_CONTRACT = "0x1fee62d24daa9fc0a18341b582937be1d837f91d";
const REQUIRED_TOKEN_IDS = [6, 14, 22, 31, 45, 46, 59, 60, 73, 80];
const CUTOFF_TIMESTAMP = Math.floor(
  new Date("2025-05-28T00:00:00Z").getTime() / 1000
);

const TRANSFER_EVENT_ABI = [
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

export default function Home() {

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [viewAddress, setViewAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string>("");
  const [hasRequiredTokens, setHasRequiredTokens] = useState(false);
  const [missingIds, setMissingIds] = useState<number[]>([]);
  const [allMintedBeforeDate, setAllMintedBeforeDate] = useState<boolean | null>(null);
  const [singleTransferOnly, setSingleTransferOnly] = useState<boolean | null>(null);

  function validateRequired(tokens: NFTData[]) {
    const ownedIds = tokens
      .filter(n => n.contractAddress.toLowerCase() === PROFESSOR_CONTRACT.toLowerCase())
      .map(n => Number(n.tokenId));
    const faltantes = REQUIRED_TOKEN_IDS.filter(id => !ownedIds.includes(id));
    setMissingIds(faltantes);
    return faltantes.length === 0;
  }

  async function checkMintDates(address: string) {
    if (!provider || !address) return false;
    const profContract = new Contract(PROFESSOR_CONTRACT, TRANSFER_EVENT_ABI, provider);
    for (const id of REQUIRED_TOKEN_IDS) {
      const filter = profContract.filters.TransferSingle(
        null,
        "0x0000000000000000000000000000000000000000",
        address
      );
      const events = await profContract.queryFilter(filter, 0, "latest");
      const mintEvent = (events as any[]).find((e: any) => {
        const tokenId = e.args?.id;
        const num = typeof tokenId.toNumber === "function"
          ? tokenId.toNumber()
          : Number(tokenId);
        return num === id;
      });
      if (!mintEvent) return false;
      const block = await provider.getBlock(mintEvent.blockNumber);
      if (!block || block.timestamp >= CUTOFF_TIMESTAMP) return false;
    }
    return true;
  }

  async function checkSingleTransfer() {
    if (!provider) return false;
    const profContract = new Contract(PROFESSOR_CONTRACT, TRANSFER_EVENT_ABI, provider);
    const allEvents = (await profContract.queryFilter(
      profContract.filters.TransferSingle(),
      0,
      "latest"
    )) as any[];
    for (const id of REQUIRED_TOKEN_IDS) {
      const count = allEvents.filter((e: any) => {
        const tokenId = e.args?.id;
        const num = typeof tokenId.toNumber === "function"
          ? tokenId.toNumber()
          : Number(tokenId);
        return num === id;
      }).length;
      if (count !== 1) return false;
    }
    return true;
  }

  const handleConnect = async () => {
    const address = await connectWallet();
    if (!address) return;
    setWalletAddress(address);
    setRecipient(address);
    setLoading(true);

    const fetched = await fetchNFTs(address);
    setNfts(fetched);

    const okRequired = validateRequired(fetched);
    setHasRequiredTokens(okRequired);

    if (okRequired) {
      const okDates = await checkMintDates(address);
      setAllMintedBeforeDate(okDates);
      if (okDates) {
        const okSingle = await checkSingleTransfer();
        setSingleTransferOnly(okSingle);
      } else {
        setSingleTransferOnly(false);
      }
    } else {
      setAllMintedBeforeDate(false);
      setSingleTransferOnly(false);
    }

    const bal = await balanceOf(address, 0);
    setBalance(bal);
    setLoading(false);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setNfts([]);
    setFilter("");
    setHasRequiredTokens(false);
    setAllMintedBeforeDate(null);
    setSingleTransferOnly(null);
    setMissingIds([]);
    setBalance(null);
    setRecipient("");
  };

  const handleFetchView = async () => {
      if (!/^0x[a-fA-F0-9]{40}$/.test(viewAddress.trim())) {
        return alert("Dirección inválida para consulta");
      }
      setLoading(true);
      const fetched = await fetchNFTs(viewAddress.trim());
      setNfts(fetched);
      setLoading(false);
    };

  // Filtrado en vivo
   const displayed = nfts.filter(nft =>
       nft.tema.toLowerCase().includes(filter.toLowerCase()) ||
       nft.alumno.toLowerCase().includes(filter.toLowerCase())
     );

     const handleMint = async () => {
      if (!walletAddress) return alert("Primero conectá la wallet.");
      if (!hasRequiredTokens) return alert("No cumples la condición de poseer los 10 NFTs del profe.");
      if (allMintedBeforeDate === false) return alert("Alguno de los NFTs fue minteado después del 28 May 2025.");
      if (singleTransferOnly === false) return alert("Alguno de los NFTs fue transferido más de una vez.");
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) return alert("Dirección inválida.");
  
      setLoading(true);
      const newId = await mint(recipient, 1);
      if (newId !== null) {
        const fetched = await fetchNFTs(walletAddress);
        setNfts(fetched);
        const bal = await balanceOf(walletAddress, 0);
        setBalance(bal);
      }
      setLoading(false);
    };

     return (
      <>
        <main className="min-h-screen py-12 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Input de consulta de otra wallet */}
            <div className="mb-6 flex gap-2 justify-center">
              <input
                type="text"
                placeholder="Wallet a consultar (0x…)"
                value={viewAddress}
                onChange={e => setViewAddress(e.target.value)}
                className="px-4 py-2 w-full sm:w-72 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800
                           text-gray-800 dark:text-gray-200"
              />
              <button
                onClick={handleFetchView}
                disabled={loading}
                className="px-4 py-2 rounded-lg font-semibold
                           bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400
                           text-white disabled:opacity-50 transition"
              >
                Ver NFTs
              </button>
            </div>
    
            <h1 className="text-4xl font-bold text-center mb-4">Mis NFTs</h1>
    
            {/* Conectar / Desconectar + input mint */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              {walletAddress ? (
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-3 w-full sm:w-auto font-semibold text-white rounded-lg
                             bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600
                             transition disabled:opacity-50"
                >
                  Desconectar Wallet
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="px-6 py-3 w-full sm:w-auto font-semibold text-white rounded-lg
                             bg-gradient-to-r from-[#6a11cb] to-[#2575fc]
                             hover:from-[#8e44ad] hover:to-[#2980b9]
                             dark:from-[#4e0436] dark:to-[#1e1e91]
                             dark:hover:from-[#7a1c6e] dark:hover:to-[#2f2f7f]
                             transition transform hover:-translate-y-1 disabled:opacity-50"
                >
                  Conectar Wallet
                </button>
              )}
    
              {walletAddress && (
                <input
                  type="text"
                  placeholder="Dirección destinataria para mint"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="px-4 py-2 w-full sm:w-72 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-800
                             text-gray-800 dark:text-gray-200"
                />
              )}
            </div>
    
            {/* Filtro */}
            {nfts.length > 0 && (
              <div className="mb-6 flex justify-center">
                <input
                  type="text"
                  placeholder="Filtrar por tema de la clase..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="px-4 py-2 w-full sm:w-1/2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-800
                             text-gray-800 dark:text-gray-200"
                />
              </div>
            )}
    
            {/* Mensajes de error / estado */}
            {!hasRequiredTokens && walletAddress && (
              <p className="text-center text-red-500 mb-4">
                Te faltan estos IDs para mintear: {missingIds.join(", ")}
              </p>
            )}
            {hasRequiredTokens && allMintedBeforeDate === false && (
              <p className="text-center text-red-500 mb-4">
                Alguno de los NFTs mintados fue después de 28 May 2025
              </p>
            )}
            {hasRequiredTokens && allMintedBeforeDate && singleTransferOnly && (
              <div className="text-center text-green-500 mb-4 space-y-2">
                <p>Todos los NFTs necesarios para mintear están presentes ✔️</p>
                <p>Todos los NFTs mintados antes de 28 May 2025 ✔️</p>
                <p>Cada NFT solo fue transferido una vez ✔️</p>
              </div>
            )}

          <div className="flex justify-center mb-10">
          <button
            onClick={handleMint}
            disabled={
              loading ||
              !walletAddress ||
              !hasRequiredTokens ||
              allMintedBeforeDate === false ||
              singleTransferOnly === false
            }
            className="px-6 py-3 w-full sm:w-auto font-semibold text-white rounded-lg bg-gradient-to-r from-[#6a11cb] to-[#2575fc] hover:from-[#8e44ad] hover:to-[#2980b9] transition transform hover:-translate-y-1 disabled:opacity-50"
          >
            Generar NFT
          </button>
         </div>
    
            {/* Skeleton Loader */}
            {loading && nfts.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl p-6 h-80
                               bg-gray-200 dark:bg-gray-700"
                  >
                    <div className="h-40 w-full rounded mb-4 bg-gray-400 dark:bg-gray-600" />
                    <div className="h-6 rounded mb-2 w-3/4 bg-gray-400 dark:bg-gray-600" />
                    <div className="h-4 rounded mb-1 w-1/2 bg-gray-400 dark:bg-gray-600" />
                    <div className="h-4 rounded w-1/3 bg-gray-400 dark:bg-gray-600" />
                  </div>
                ))}
              </div>
            )}
    
            {/* Grid de NFTs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayed.length > 0 ? (
                displayed.map(nft => (
                  <NFTCard key={`${nft.contractAddress}-${nft.tokenId}`} nft={nft} />
                ))
              ) : (
                !loading && (
                  <p className="text-center text-gray-400 dark:text-gray-500 col-span-full">
                    No se encontraron NFTs para esta wallet.
                  </p>
                )
              )}
            </div>
    
            {/* Spinner de acción */}
            {loading && nfts.length > 0 && (
              <div className="mb-6 flex flex-col items-center">
                <Loadings />
                <span className="mt-2 text-gray-500 dark:text-gray-400">
                  Procesando...
                </span>
              </div>
            )}
          </div>
        </main>
      </>
    );
    
}