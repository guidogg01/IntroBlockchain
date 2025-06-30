"use client";

import { useState } from "react";
import { ERC1155_ABI, connectWallet, mint, promote, balanceOf, provider } from "@/lib/contract";
import { fetchNFTs, NFTData } from "@/lib/alchemy";
import NFTCard from "@/components/NFTCard";
import Loadings from "@/components/Loading";
import { Contract, toUtf8Bytes, hexlify } from "ethers";
import { motion } from "framer-motion";
import confetti from 'canvas-confetti';


const PROFESSOR_CONTRACT = "0x1fee62d24daa9fc0a18341b582937be1d837f91d";
const ADMIN_ADDRESS = "0xdC9a1c08BF68571eD4990eC7B6De0A8fe77f09C6".toLowerCase();
const MY_CONTRACT        = "0xB6C4516cbb859Aaa9FAddF2626D4C2E1a47EFf87";
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
  const [walletAddress, setWalletAddress]             = useState<string | null>(null);
  const [nfts, setNfts]                               = useState<NFTData[]>([]);
  const [filter, setFilter]                           = useState<string>("");
  const [viewAddress, setViewAddress]                 = useState<string>("");
  const [loading, setLoading]                         = useState(false);
  const [balance, setBalance]                         = useState<string | null>(null);
  const [recipient, setRecipient]                     = useState<string>("");
  const [alumnoNames, setAlumnoNames]                 = useState<Record<string, string>>({});
  const [descriptionMap, setDescriptionMap]           = useState<Record<string,string>>({});
  const [tituloMap, setTituloMap]                     = useState<Record<string,string>>({});
  const [pendingAlumnoName, setPendingAlumnoName]     = useState("");
  const [pendingDescription, setPendingDescription]   = useState("");
  const [pendingTitle, setPendingTitle] = useState("");
  const [hasRequiredTokens, setHasRequiredTokens]     = useState(false);
  const [missingIds, setMissingIds]                   = useState<number[]>([]);
  const [allMintedBeforeDate, setAllMintedBeforeDate] = useState<boolean | null>(null);
  const [singleTransferOnly, setSingleTransferOnly]   = useState<boolean | null>(null);
  const [originMap, setOriginMap] = useState<Record<string,string>>({});
  const [promoUsedOnChain, setPromoUsedOnChain] = useState<boolean>(false);

  // Nuevo estado para la promo
  const [hasPromoToken, setHasPromoToken]             = useState<boolean>(false);

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

    // Tus validaciones existentes
    const okRequired = validateRequired(fetched);
    setHasRequiredTokens(okRequired);
    if (okRequired) {
      const okDates = await checkMintDates(address);
      setAllMintedBeforeDate(okDates);
      setSingleTransferOnly(okDates ? await checkSingleTransfer() : false);
    } else {
      setAllMintedBeforeDate(false);
      setSingleTransferOnly(false);
    }

    // Nueva validación: tiene al menos un NFT de MY_CONTRACT?
    const ownsPromo = fetched.some(
      n => n.contractAddress.toLowerCase() === MY_CONTRACT.toLowerCase()
    );
    setHasPromoToken(ownsPromo);

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
    setHasPromoToken(false);
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

  const handleMint = async () => {
    
    if (!walletAddress) {
      return alert("Primero conectá la wallet.");
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      return alert("Dirección inválida.");
    }
  
    if (!hasRequiredTokens || allMintedBeforeDate === false || singleTransferOnly === false) {
      return;
    }
  
    // 2) validación de inputs
    if (!pendingAlumnoName.trim()) {
      return alert("Por favor ingresa el nombre del alumno.");
    }
    if (!pendingTitle.trim()) {
      return alert("Por favor ingresa un título.");
    }
    if (!pendingDescription.trim()) {
      return alert("Por favor ingresa una descripción.");
    }
  
    setLoading(true);
  
    // 3) convertimos cada campo a bytes hex
    const dataBytes        = hexlify(toUtf8Bytes(pendingAlumnoName.trim()));
    const titleBytes       = hexlify(toUtf8Bytes(pendingTitle.trim()));
    const descriptionText  = pendingDescription.trim();
  
    // 4) mint: ahora con 5 argumentos
    const newId = await mint(
      recipient,
      1,
      dataBytes,
      titleBytes,
      descriptionText
    );
  
    if (newId !== null && walletAddress) {
      // 5) guardamos localmente los maps para renderizar en la UI
      setAlumnoNames(prev => ({
        ...prev,
        [newId.toString()]: pendingAlumnoName.trim(),
      }));
      setTituloMap(prev => ({
        ...prev,
        [newId.toString()]: pendingTitle.trim(),
      }));
      setDescriptionMap(prev => ({
        ...prev,
        [newId.toString()]: pendingDescription.trim(),
      }));

      setOriginMap(m => ({ ...m, [newId]: walletAddress! }));
  
      // 6) limpiamos los inputs
      setPendingAlumnoName("");
      setPendingTitle("");
      setPendingDescription("");
  
      // 7) refrescamos la lista de NFTs y balance
      const refreshed = await fetchNFTs(walletAddress);
      setNfts(refreshed);
      const bal = await balanceOf(walletAddress, 0);
      setBalance(bal);
  
      // 8) animación de confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  
    setLoading(false);
  };
  
  

  // Nuevo handler para promoción
  const handleSendPromotion = async () => {

    if (!walletAddress) return alert("Conéctate primero.");
    if (!hasPromoToken) return alert("No tienes el NFT de promoción.");
    if (promoUsedOnChain) return alert("🚨 Ya enviaste la promoción. Solo se permite una vez.");
    if (!pendingAlumnoName.trim()) return alert("Por favor ingresa el nombre del alumno.");
  
    setLoading(true);
    // convertimos el nombre a bytes UTF-8
    const dataBytes        = hexlify(toUtf8Bytes(pendingAlumnoName.trim()));
    const titleBytes       = hexlify(toUtf8Bytes(pendingTitle.trim()));
    const descriptionText  = pendingDescription.trim();
  
    // 4) mint: ahora con 5 argumentos
    const newId = await promote(
      recipient,
      1,
      dataBytes,
      titleBytes,
      descriptionText
    );
    setLoading(false);
  
    if (newId !== null && walletAddress) {
      // 5) guardamos localmente los maps para renderizar en la UI
      setAlumnoNames(prev => ({
        ...prev,
        [newId.toString()]: pendingAlumnoName.trim(),
      }));
      setTituloMap(prev => ({
        ...prev,
        [newId.toString()]: pendingTitle.trim(),
      }));
      setDescriptionMap(prev => ({
        ...prev,
        [newId.toString()]: pendingDescription.trim(),
      }));

      setOriginMap(m => ({ ...m, [newId]: walletAddress! }));
      
      setPendingAlumnoName("");
      setPendingTitle("");
      setPendingDescription("");

      const refreshed = await fetchNFTs(walletAddress);
      setNfts(refreshed);
      const bal = await balanceOf(walletAddress, 0);
      setBalance(bal);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      alert("🚀 Promoción enviada!");

      try {
        const c = new Contract(MY_CONTRACT, ERC1155_ABI, provider);
        const used = await c.hasPromoted(walletAddress);
        setPromoUsedOnChain(used);
      } catch (err) {
        console.error("No pude leer hasPromoted después de mint:", err);
      }
    }
  };
  
  const validationMessages: string[] = [];
    if (!hasRequiredTokens) validationMessages.push("❌ Faltan los 10 NFTs de los profesores.");
    if (allMintedBeforeDate === false) validationMessages.push("❌ Algún NFT fue mintado después del 28/05/2025.");
    if (singleTransferOnly === false) validationMessages.push("❌ Algún NFT fue transferido más de una vez.");


  // Filtrado en vivo
  const displayed = nfts.filter(nft =>
    nft.tema.toLowerCase().includes(filter.toLowerCase()) ||
    nft.alumno.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
     <main className="relative min-h-screen py-12 px-4 sm:px-8">
  {/* Overlay de carga */}
  {loading && (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-gray-100/0 backdrop-blur-sm">
      <Loadings />
    </div>
  )}


        <div className="max-w-5xl mx-auto">

          {/* Input de consulta de otra wallet */}
          <div className="mb-6 flex gap-2 justify-center">
            <input
              type="text"
              placeholder="Wallet a consultar (0x…)"
              value={viewAddress}
              onChange={e => setViewAddress(e.target.value)}
              className="px-4 py-2 w-full sm:w-72 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
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
                           bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
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
                           bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              />
            </div>
          )}

         
          {walletAddress && (
  <div className="mb-4 flex justify-center">
    <input
      type="text"
      placeholder="Ingresa un título para el NFT"
      value={pendingTitle}
      onChange={e => setPendingTitle(e.target.value)}
      className="
        px-4 py-2 w-full sm:w-72
        border border-gray-300 dark:border-gray-600 rounded-lg
        bg-white dark:bg-gray-800
        text-gray-800 dark:text-gray-200
        focus:outline-none focus:ring-2 focus:ring-indigo-400
      "
    />
  </div>
)}
{walletAddress && (
  <div className="mb-4 flex justify-center">
    <input
      type="text"
      placeholder="Ingresa una descripción para el NFT"
      value={pendingDescription}
      onChange={e => setPendingDescription(e.target.value)}
      className="
        px-4 py-2 w-full sm:w-72
        border border-gray-300 dark:border-gray-600 rounded-lg
        bg-white dark:bg-gray-800
        text-gray-800 dark:text-gray-200
        focus:outline-none focus:ring-2 focus:ring-indigo-400
      "
    />
  </div>
)}

{walletAddress && (
  <div className="mb-4 flex justify-center">
    <input
      type="text"
      placeholder="Ingresa nombre del alumno"
      value={pendingAlumnoName}
      onChange={e => setPendingAlumnoName(e.target.value)}
      className="
        px-4 py-2 w-full sm:w-72
        border border-gray-300 dark:border-gray-600 rounded-lg
        bg-white dark:bg-gray-800
        text-gray-800 dark:text-gray-200
        focus:outline-none focus:ring-2 focus:ring-indigo-400
      "
    />
  </div>
)}

{/* ——— Botón Generar NFT (sólo admin + condiciones) ——— */}
{/* — Mensajes de validación — */}
{walletAddress && validationMessages.length > 0 && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
            {validationMessages.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        )}

        {walletAddress && (
          <div className="flex justify-center mb-6">
            <motion.button
              onClick={handleMint}
              disabled={
                loading ||
                (walletAddress.toLowerCase() === ADMIN_ADDRESS && validationMessages.length > 0)
              }
              whileTap={{ scale: 0.95 }}
              className={`
                px-6 py-3 w-full sm:w-auto font-semibold text-white rounded-lg
                bg-gradient-to-r from-[#6a11cb] to-[#2575fc]
                hover:from-[#8e44ad] hover:to-[#2980b9]
                transition transform hover:-translate-y-1
                ${(loading || validationMessages.length > 0)
                  ? "opacity-50 cursor-not-allowed"
                  : ""}
              `}
            >
              Generar NFT
            </motion.button>
          </div>
        )}

          {walletAddress && (
            <div className="flex justify-center mb-6">
              <button
                onClick={handleSendPromotion}
                disabled={loading || !hasPromoToken || promoUsedOnChain}
                className={`
                  px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition
                  ${(loading || !hasPromoToken || promoUsedOnChain) ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                💣 Enviar Promoción
              </button>
            </div>
          )}

          {loading && nfts.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl p-6 h-80 bg-gray-200 dark:bg-gray-700"
                >
                  <div className="h-40 w-full rounded mb-4 bg-gray-400 dark:bg-gray-600" />
                  <div className="h-6 rounded mb-2 w-3/4 bg-gray-400 dark:bg-gray-600" />
                  <div className="h-4 rounded mb-1 w-1/2 bg-gray-400 dark:bg-gray-600" />
                  <div className="h-4 rounded w-1/3 bg-gray-400 dark:bg-gray-600" />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayed.length > 0 ? (
              displayed.map(nft => (
                <NFTCard
                  key={`${nft.contractAddress}-${nft.tokenId}`}
                  nft={nft}
                />
              ))
            ) : (
              !loading && (
                <p className="text-center text-gray-400 dark:text-gray-500 col-span-full">
                  No se encontraron NFTs para esta wallet.
                </p>
              )
            )}
          </div>
        </div>
      </main>
    </>
  );
}
