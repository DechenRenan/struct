import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">


      
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Relátorio de áudio</h1>
            <p className="text-muted-foreground">Nos envie seu áudio para que possamos transcrever e gerar seu relátorio</p>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm" data-v0-t="card">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">Upload Audio File</h3>
              <p className="text-sm text-muted-foreground">Escolha o audio a ser enviado.</p>
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
                />
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm" data-v0-t="card">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">Endereço de e-mail</h3>
              <p className="text-sm text-muted-foreground">Complete o e-mail para que seja enviado o relatório assim que estiver pronto
              </p>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    htmlFor="recipient-email"
                  >
                    DIgite seu e-mail
                  </label>
                  <input
                    className="flex h-10 w-full text-black rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    id="recipient-email"
                    placeholder="example@email.com"
                    type="email"
                  />
                </div>

              </form>
            </div>
            <div className="items-center p-6 flex justify-end">
              <button
                id="send"
                className="rounded-lg border bg-card text-card-foreground shadow-sm inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                type="submit"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
    </main>
  );
}
