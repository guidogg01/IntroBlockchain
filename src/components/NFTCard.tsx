// src/components/NFTCard.tsx
"use client";

import { useEffect, useState } from "react";
import { NFTData } from "@/lib/alchemy";
import { getClaseData } from "@/lib/contract";

// Direcciones de contrato
const PROFESSOR_CONTRACT = "0x1fee62d24daa9fc0a18341b582937be1d837f91d";
const MY_CONTRACT        = "0xe3Dc6ab415D10a1B8bd817057B0Dd58396d37F55";

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
    // Solo pedimos datosDeClases si viene del contrato del profe
    if (
      nft.contractAddress.toLowerCase() ===
      PROFESSOR_CONTRACT.toLowerCase()
    ) {
      getClaseData(nft.tokenId).then((res) => {
        if (res) setDatosClase(res);
      });
    } else {
      // Limpio por si venía otro dato
      setDatosClase(null);
    }
  }, [nft.contractAddress, nft.tokenId]);

  return (
    <div className="bg-gradient-to-br from-[#f5f7fa] to-[#e4ebf1]
                    border-2 border-[#d1d9e6] rounded-xl p-6 shadow-lg
                    hover:shadow-xl transition duration-300 text-left max-w-md mx-auto">
      {nft.imageUrl && (
        <img
          src={nft.imageUrl}
          alt={nft.name}
          className="w-full h-52 object-cover rounded-md border mb-4"
        />
      )}
      <h3 className="text-2xl font-bold text-[#34495e] mb-2">
        {nft.name || "Sin nombre"}
      </h3>
      <p className="text-[#2c3e50] mb-2">
        <strong>Descripción:</strong> {nft.description}
      </p>
      <p className="text-[#2c3e50] mb-2">
        <strong>Contrato:</strong> {nft.contractAddress}
      </p>
      <p className="text-[#2c3e50] mb-4">
        <strong>Token ID:</strong> {nft.tokenId}
      </p>

      {nft.contractAddress.toLowerCase() ===
      PROFESSOR_CONTRACT.toLowerCase() ? (
        // — NFT del profe: muestro clase/tema/alumno
        datosClase ? (
          <div className="bg-[#d7e3fc] rounded-md p-4 text-[#2c3e50]">
            <p><strong>Clase:</strong> {datosClase.clase}</p>
            <p><strong>Tema:</strong> {datosClase.tema}</p>
            <p><strong>Alumno:</strong> {datosClase.alumno}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Cargando datos on-chain...</p>
        )
      ) : nft.contractAddress.toLowerCase() ===
        MY_CONTRACT.toLowerCase() ? (
        // — NFT tuyo: muestro otros atributos
        <div className="bg-[#fcf5f7] rounded-md p-4 text-[#2c3e50]">
          <p><strong>Origen:</strong> {nft.contractAddress}</p>
          <p>
  <strong>Fecha mint:</strong>{" "}
  {new Date().toLocaleDateString()}
</p>
          <p><strong>Alumno:</strong> Guido Greco</p>
        </div>
      ) : null}
    </div>
  );
}
