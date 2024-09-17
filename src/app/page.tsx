"use client"; // Adicione esta linha no início do arquivo

import { useState } from "react";

import Image from 'next/image';

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioLevel, setAudioLevel] = useState("tiny");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleAudioLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAudioLevel(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    if (audioFile) {
      formData.append("audioFile", audioFile);
    }
    formData.append("audioLevel", audioLevel);
    formData.append("email", email);

    // Send form data to the API route
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setLoading(false);
    
    if (res.ok) {
      // Handle successful response
      alert("Dados enviados com sucesso!");
    } else {
      // Handle error
      alert("Erro ao enviar os dados!");
    }
  };

  const Loading = () => (
    <div className="w-screen max-w-md mx-auto space-y-6 itens h-full">

      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce delay-200"></div>
        <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce delay-400"></div>
      </div>
      <p className="mt-4 text-lg">Sua transcrição será enviada para o e-mail em breve...</p>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-row p-24 bg-sky-900 h-screen scroll-m-0 ">
      <Image
          src="/struct/move.jpeg" // Caminho para a imagem
          layout="fill"
          alt="Background Image"  
          objectFit="cover" // Cobre o fundo
          className="absolute z-0 blur-sm" // A imagem fica atrás do conteúdo
        />
    <div className="absolute inset-0 bg-blue-600 opacity-50 blur-xl z-10" />
  {/* Left side with image and text */}
  <div   className="flex-1 flex flex-col absolute left-0 top-0 justify-self-start items-center  bg-center w-4/6  h-screen text-white ">
    
    <div className="absolute text-center justify-center z-20 w-auto h-auto pt-96">
      <h1 className="text-5xl font-bold pb-10">Boas Víndas ao Move transcreve</h1>
      <br/>
      <p className="text-lg ">
        Envie seu áudio e escolha o tamanho da IA para fazer a transcrição do seu áudio. O resultado será enviado para o seu e-mail.
      </p>
    </div>
  </div>

  {/* Right side with form */}
  <div className=" absolute right-7 top-7 min-w-52 z-1 w-auto bg-white text-black p-12 shadow-lg rounded-lg blur-none h-auto z-30">
    {loading ? (
      <Loading />
    ) : (
      <div className="w-screen max-w-md mx-auto space-y-6">
        <div className="text-center ">
          <h1 className="text-3xl font-bold justify-center align-middle text-center">
            <Image
              src="/struct/logo.png" // Caminho para a imagem
              width={80}
              height={80}
              alt=""   // Cobre o fundo
              className="absolute z-0" // A imagem fica atrás do conteúdo
              />Transcreve IA</h1>
          <br/>
          <br/>
          <br/>
        </div>
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-lg border bg-card text-card-foreground shadow-sm border-black"
            data-v0-t="card"
          >
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">
                Upload do áudio
              </h3>
              <p className="text-sm text-muted-foreground">Escolha o áudio a ser enviado.</p>
            </div>
            <div className="p-6">
              <div className="space-y-2 border-black">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="audio-file"
                >
                  Audio:
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="audio-file"
                  accept="audio/*"
                  type="file"
                  onChange={handleAudioChange}
                />
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="audio-level"
                >
                  Nível da tradução:
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input border-black px-3 py-2 text-sm text-black ring-offset-background"
                  id="audio-level"
                  value={audioLevel}
                  onChange={handleAudioLevelChange}
                >
                  <option value="tiny">tiny</option>
                  <option value="base">base</option>
                  <option value="small">small</option>
                  <option value="medium">medium</option>
                  <option value="large">large</option>
                </select>
              </div>
            </div>
          </div>
          <br/>
          <div
            className="rounded-lg border bg-card text-card-foreground shadow-sm border-black"
            data-v0-t="card"
          >
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">
                Endereço de e-mail
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete o e-mail para que seja enviado o relatório assim que estiver pronto
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="recipient-email"
                >
                  Digite seu e-mail
                </label>
                <input
                  className="flex h-10 w-full text-black rounded-md border border-input border-black bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="recipient-email"
                  placeholder="example@email.com"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
            </div>
            <div className="items-center p-6 flex justify-end">
              <button
                id="send"
                className="rounded-lg border bg-card text-card-foreground shadow-sm inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                type="submit"
              >
                Enviar Email
              </button>
            </div>
          </div>
        </form>
      </div>
    )}
  </div>
</main>
  );
}

