"use client";

import { useEffect, useState } from "react";
import { NFTData } from "@/lib/alchemy";
import { getClaseData } from "@/lib/contract";

interface Props {
  nft: NFTData;
}

export default function NFTCard({ nft }: Props) {
  const [datosClase, setDatosClase] = useState<{
    clase: string;
    tema: string;
    alumno: string;
  } | null>(null);

  useEffect(() => {
    async function fetchClaseData() {
      const result = await getClaseData(nft.tokenId);
      if (result) setDatosClase(result);
    }

    fetchClaseData();
  }, [nft.tokenId]);

  return (
    <div className="bg-gradient-to-br from-[#f5f7fa] to-[#e4ebf1] border-2 border-[#d1d9e6] rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300 text-left max-w-md mx-auto">
      {nft.imageUrl && (
        <img
          src={nft.imageUrl}
          alt={nft.name}
          className="w-full h-52 object-cover rounded-md border mb-4"
        />
      )}
      <h3 className="text-2xl font-bold text-[#34495e] mb-2">{nft.name}</h3>
      <p className="text-[#2c3e50] mb-2">
        <strong>Descripción:</strong> {nft.description}
      </p>
      <p className="text-[#2c3e50] mb-2">
        <strong>Contrato:</strong> {nft.contractAddress}
      </p>
      <p className="text-[#2c3e50] mb-4">
        <strong>Token ID:</strong> {nft.tokenId}
      </p>

      {datosClase ? (
        <div className="bg-[#d7e3fc] rounded-md p-4 text-[#2c3e50]">
          <p>
            <strong>Clase:</strong> {datosClase.clase}
          </p>
          <p>
            <strong>Tema:</strong> {datosClase.tema}
          </p>
          <p>
            <strong>Alumno:</strong> {datosClase.alumno}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Cargando datos on-chain...</p>
      )}
    </div>
  );
}
