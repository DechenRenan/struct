// /src/app/consulta/page.tsx

"use client"; // Adicione esta linha no início do arquivo

import { useEffect, useState } from 'react';

export default function Consulta() {
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    async function fetchUploads() {
      const res = await fetch('/api/getUploads');
      const data = await res.json();
      setUploads(data);
      console.log(data);
    }

    fetchUploads();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 text-white">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Consultas de Áudio</h1>
          <p className="text-muted-foreground">
            Aqui estão os áudios enviados:
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Uploads:</h2>
          <ul>
            {
        
                uploads.map((upload) => (
                  <li key={upload.id as any}>
                    <p className='text-slate-400'>Id: {upload.id}</p>
                    <p className='text-slate-400'>Email: {upload.email}</p>
                    <p className='text-slate-400'>Audio Level: {upload.audioLevel}</p>
                    <p className='text-slate-400'>Audio File Path: {upload.audioFilePath}</p>
                    <p className='text-slate-400'>Status: {upload.status}</p>
                  </li>
                ))
            
            }
          </ul>
        </div>
      </div>
    </main>
  );
}
