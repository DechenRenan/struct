"use client"; // Adicione esta linha no início do arquivo

import { useState } from "react";

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

    alert("Obrigado por enviar seu audio. Te enviei um e-mail garantir que seu e-mail está correto : )");
  };

  const Loading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce delay-200"></div>
        <div className="w-4 h-4 bg-gray-600 rounded-full animate-bounce delay-400"></div>
      </div>
      <p className="mt-4 text-lg">Sua transcrição será enviada para o e-mail em breve...</p>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Relatório de áudio</h1>
            <p className="text-muted-foreground">
              Nos envie seu áudio para que possamos transcrever e gerar seu relatório
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
              data-v0-t="card"
            >
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">
                  Upload Audio File
                </h3>
                <p className="text-sm text-muted-foreground">Escolha o áudio a ser enviado.</p>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    htmlFor="audio-file"
                  >
                    Audio:
                  </label>
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex h-10 w-full rounded-md border border-input bg-black px-3 py-2 text-sm ring-offset-background"
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
            <div
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
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
                    className="flex h-10 w-full text-white bg-black rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
    </main>
  );
}
