// src/components/NFTCard.tsx
"use client";

import { useEffect, useState } from "react";
import { NFTData } from "@/lib/alchemy";
import { ERC1155_ABI, getClaseData, getMintDate, provider } from "@/lib/contract";
import { Contract } from "ethers";

const PROFESSOR_CONTRACT = "0x1fee62d24daa9fc0a18341b582937be1d837f91d";
const MY_CONTRACT        = "0xB6C4516cbb859Aaa9FAddF2626D4C2E1a47EFf87"; 

interface Props {
  nft: NFTData;
}

export default function NFTCard({ nft }: Props) {
  const [datosClase,  setDatosClase]  = useState<{ clase: string; tema: string; alumno: string } | null>(null);
  const [mintDate,    setMintDate]    = useState<Date | null>(null);
  const [alumnoInput, setAlumnoInput] = useState<string>("");
  const [tituloOnChain, setTituloOnChain] = useState<string | null>(null);
  const [descripcionOnChain, setDescripcionOnChain] = useState<string | null>(null);
  const [originAddress, setOriginAddress] = useState<string | null>(null);

  useEffect(() => {
    if (nft.contractAddress.toLowerCase() === PROFESSOR_CONTRACT.toLowerCase()) {
      getClaseData(nft.tokenId).then(res => {
        if (res) {
          setDatosClase(res);
        }
      });
    } else {
      setDatosClase(null);
    }

    // 2) Siempre intentamos leer la fecha de minteo
    getMintDate(nft.tokenId).then(d => {
      if (d) setMintDate(d);
    });

    if (
      nft.contractAddress.toLowerCase() === MY_CONTRACT.toLowerCase() &&
      provider
    ) {
      const c = new Contract(MY_CONTRACT, ERC1155_ABI, provider);

      Promise.all([
        c.nombreAlumno(nft.tokenId),
        c.tituloAlumno(nft.tokenId),
        c.descripcionNFT(nft.tokenId),
        c.originOf(nft.tokenId),
      ])
      .then(([nombre, titulo, descripcion, originAddress]: [string, string, string, string]) => {
        if (nombre.trim())       setAlumnoInput(nombre);
        if (titulo.trim())       setTituloOnChain(titulo);
        if (descripcion.trim())  setDescripcionOnChain(descripcion);
        setOriginAddress(originAddress);
      })
      .catch(err => {
        console.error("Error leyendo metadata on-chain:", err);
      });
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
        {nft.contractAddress.toLowerCase() === PROFESSOR_CONTRACT.toLowerCase()
          ? nft.name || "Sin nombre"
          : tituloOnChain?.trim() ?? "Sin nombre"}
      </h3>
      <p className="text-[#2c3e50] mb-2">
        <strong>{"Descripción:"}</strong> {descripcionOnChain?.trim() || nft.description}
      </p>
      <p className="text-[#2c3e50] mb-2">
        <strong>Contrato:</strong> {nft.contractAddress}
      </p>
      <p className="text-[#2c3e50] mb-4">
        <strong>Token ID:</strong> {nft.tokenId}
      </p>

      {/** — Caso profesor — **/}
      {nft.contractAddress.toLowerCase() === PROFESSOR_CONTRACT.toLowerCase() ? (
        datosClase ? (
          <div className="bg-[#d7e3fc] rounded-md p-4 text-[#2c3e50]">
            <p><strong>Clase:</strong> {datosClase.clase}</p>
            <p><strong>Tema:</strong> {datosClase.tema}</p>
            <p><strong>Alumno:</strong> {datosClase.alumno}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Cargando datos on-chain…</p>
        )
      ) : 
      
      nft.contractAddress.toLowerCase() === MY_CONTRACT.toLowerCase() ? (
        <div className="bg-[#fcf5f7] rounded-md p-4 text-[#2c3e50] space-y-2">
          <p>
            <strong>Origen:</strong> { originAddress ?? "—" }
          </p>
          {mintDate ? (
            <p><strong>Fecha mint:</strong> {mintDate.toLocaleDateString()}</p>
          ) : (
            <p className="text-sm text-gray-400">Cargando fecha de mint…</p>
          )}
        <p>
          <strong>Alumno:</strong>{" "}
          {alumnoInput.trim() || "—"}
       </p>
        </div>
      ) : null}
    </div>
  );
}
