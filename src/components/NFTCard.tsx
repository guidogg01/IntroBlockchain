// src/components/NFTCard.tsx
"use client";

import { useEffect, useState } from "react";
import { NFTData } from "@/lib/alchemy";
import { getClaseData, getMintDate, provider } from "@/lib/contract";
import { Contract } from "ethers";
import { toUtf8String } from "ethers";

const PROFESSOR_CONTRACT = "0x1fee62d24daa9fc0a18341b582937be1d837f91d";
const MY_CONTRACT        = "0xfbc66BD5309017845035D25D2905dD8F5F11d6F9";

const TRANSFER_EVENT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "address", name: "operator", type: "address" },
      { indexed: true,  internalType: "address", name: "from",     type: "address" },
      { indexed: true,  internalType: "address", name: "to",       type: "address" },
      { indexed: false, internalType: "uint256", name: "id",       type: "uint256" },
      { indexed: false, internalType: "uint256", name: "value",    type: "uint256" },
      { indexed: false, internalType: "bytes",    name: "data",     type: "bytes" },
    ],
    name: "TransferSingle",
    type: "event",
  },
];

interface Props {
  nft: NFTData;
  /** Nombre ingresado al momento de mintear (solo para tu contrato MY_CONTRACT) */
  alumnoName?: string;
}

export default function NFTCard({ nft, alumnoName }: Props) {
  const [datosClase,  setDatosClase]  = useState<{ clase: string; tema: string; alumno: string } | null>(null);
  const [mintDate,    setMintDate]    = useState<Date | null>(null);
  const [alumnoInput, setAlumnoInput] = useState<string>("");

  useEffect(() => {
    // 1) Si viene del contrato del profe, pedimos datosDeClases
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

    if (alumnoName) {
      setAlumnoInput(alumnoName);
      return;
    }

    // 3) Para nuestro contrato, extraemos el `data` del evento TransferSingle por tokenId
    if (
      nft.contractAddress.toLowerCase() === MY_CONTRACT.toLowerCase() &&
      provider
    ) {
      (async () => {
        try {
          const zero = "0x0000000000000000000000000000000000000000";
          const contract = new Contract(MY_CONTRACT, TRANSFER_EVENT_ABI, provider);

          // filtrar el mint de este tokenId
          const filter = contract.filters.TransferSingle(
            null,       // cualquier operador
            zero,       // desde AddressZero
            null,       // a cualquier to
            nft.tokenId // exactamente este token
          );
          const events = await contract.queryFilter(filter, 0, "latest");
          if (events.length > 0) {
            const evt: any = events[0];
            const dataBytes: string = evt.args.data;
            const texto = toUtf8String(dataBytes);
            setAlumnoInput(texto);
          }
        } catch {
          // ignoro si falla (RPC, parsing, etc)
        }
      })();
    }
  }, [nft.contractAddress, nft.tokenId, alumnoName]);

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
      
      /** — Caso tu contrato: usamos el nombre almacenado en el evento — **/
      nft.contractAddress.toLowerCase() === MY_CONTRACT.toLowerCase() ? (
        <div className="bg-[#fcf5f7] rounded-md p-4 text-[#2c3e50] space-y-2">
          <p><strong>Origen:</strong> {"0xdC9a1c08BF68571eD4990eC7B6De0A8fe77f09C6"}</p>
          {mintDate ? (
            <p><strong>Fecha mint:</strong> {mintDate.toLocaleDateString()}</p>
          ) : (
            <p className="text-sm text-gray-400">Cargando fecha de mint…</p>
          )}
          <p>
            <strong>Alumno:</strong>{" "}
            {alumnoInput.trim() !== "" ? alumnoInput : "—"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
