import 'dotenv/config';

import { NextRequest, NextResponse } from 'next/server';
import Busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';

const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.GOOGLE_USER, // Seu endereço de Gmail
      pass:  process.env.GOOGLE_PASS     // Sua Senha de App
  }
});
export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), '/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

let processingQueue: Array<{ audioFile: string, audioLevel: string, email:string}> = [];

let isProcessing = false ;

async function parseForm(req: NextRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: { ...Object.fromEntries(req.headers) } });
    const fields: any = {};
    const files: any = {};

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, filename) => {
      const saveTo = path.join(uploadDir, filename.filename);
      const writeStream = fs.createWriteStream(saveTo);
      file.pipe(writeStream);

      file.on('end', () => {
        files[fieldname] = saveTo;
      });
      writeStream.on('error', (error) => {
        reject(error);
      });
      writeStream.on('finish', () => {
        console.log('arquivo salvo em ${saveTo}');
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, files });
    });

    busboy.on('error', (error) => {
      reject(error);
    });

    const reader = req.body?.getReader();

    if (!reader) {
      reject(new Error('Unable to read request body'));
      return;
    }

    const readChunk = () => {
      reader.read().then(({ done, value }) => {
        if (done) {
          busboy.end();
        } else {
          if (value) {
            busboy.write(value);
          }
          readChunk();
        }
      }).catch(reject);
    };

    readChunk();
  });
}

async function processNextInQueue() {


  const user = await prisma.upload.findFirst({
    where: {
      status: 'PENDING',
    },
  })
  const id = user?.id;
  const audioFile = user?.audioFilePath;
  const audioLevel = user?.audioLevel;
  const email = user?.email;

  console.log(user);
  // Comando para executar o Whisper via linha de comando
  const whisperCommand = `whisper ${audioFile} --model ${audioLevel} --output_format txt --output_dir uploads --language Portuguese --task transcribe`;
  if(audioFile){
    const fileNameWithoutExt = path.basename(audioFile, path.extname(audioFile));

   console.log(fileNameWithoutExt);

   exec(whisperCommand, (error, stdout, stderr) => {
     if (error) {
       console.error(`Error executing Whisper command: ${error.message}`);
       return;
     }
     if (stderr) {
       console.error(`Whisper command error: ${stderr}`);
       return;
     }
    
     console.log(`Transcription saved to: ${fileNameWithoutExt}`);
   });
   const transcriptionPath = path.join(process.cwd(), `/uploads/${fileNameWithoutExt}.txt`);
   const sendEmail = (transcription: string) => {
     const mailOptions = {
       from: 'dechenwhisper@gmail.com',
       to: email,
       subject: 'Olá do novo tradutor do Move',
       html: `
         <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
           <div style="background-color: #f4f4f4; padding: 20px;">
             <h1 style="color: #007BFF; text-align: center;">Olá, bem-vindo ao Move Tradutor!</h1>
             <p style="text-align: center; font-size: 16px; color: #555;">
               Estamos muito felizes em ter você conosco. Veja abaixo a transcrição que você solicitou:
             </p>
             <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
               <h3 style="color: #007BFF;">Transcrição:</h3>
               <p style="font-size: 14px; color: #333; white-space: pre-wrap;">${transcription}</p>
             </div>
             <p style="text-align: center; margin-top: 20px;">
               <a href="http://127.0.0.1:3000/" style="background-color: #007BFF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Acessar o Move</a>
             </p>
           </div>
           <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
             <p>Este e-mail foi enviado por <strong>Move Tradutor</strong>.</p>
             <p>Se você tiver alguma dúvida, entre em contato com a nossa equipe de suporte.</p>
           </footer>
         </div>
       `,
     };

     transporter.sendMail(mailOptions, async (error: { message: string; }, info: { response: string; }) => {
        if (error) {
            return console.log('Erro ao enviar email: ' + error.message);
        }

        console.log('Email enviado: ' + info.response);

        fs.unlinkSync(transcriptionPath);

        console.log('Arquivo apagado com sucesso.');

        //update no pending dele
        await prisma.upload.update({
          where: {
            id: id,
          },
          data: {
           status : 'DONE',
          }
        });
        
        processNextInQueue();

      });
   };
   const checkFileAndSendEmail = () => {
     const fileExists = fs.existsSync(transcriptionPath);
    
     if (fileExists) {
         const transcription = fs.readFileSync(transcriptionPath, 'utf-8');
         sendEmail(transcription);

     } else {
         console.log('Arquivo não encontrado. Tentando novamente em 10 segundos...');
         setTimeout(checkFileAndSendEmail, 10000); // Espera 10 segundos e tenta novamente
     }
   };
   checkFileAndSendEmail();

  }

 
}

export async function POST(req: NextRequest) {
  try {
    const { fields, files } = await parseForm(req);
    console.log('Parsed form data:', { fields,files });

    const { audioLevel, email } = fields;
    const audioFile = files.audioFile;

    if(!audioFile){
      throw new Error('Audio faltando');
    }
    await prisma.upload.create({
      data: {
        email: email,
        audioLevel: audioLevel,
        audioFilePath: audioFile,
        status: "PENDING",
      },
    });

    const countPending = await prisma.upload.count(
      {
        where: {
          status: 'PENDING',
        }
      }
    );
    
    // aqui eu quero abrir a o myenv do python executar o whisper com o audio designado. 

    try {
      const mailOptions = {
        from: 'dechenwhisper@gmail.com',
        to: email,
        subject: 'Olá do novo tradutor do move',
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="background-color: #f4f4f4; padding: 20px;">
            <h1 style="color: #007BFF; text-align: center;">Olá, bem-vindo ao Move Tradutor!</h1>
            <p style="text-align: center; font-size: 16px; color: #555;">
              Estamos muito felizes em ter você conosco. Veja abaixo a transcrição que você solicitou:
            </p>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center;">
              <h3 style="color: #007BFF;">Aguade que logo será traduzido, temos atualmente ${countPending} áudios na fila</h3>
              
            </div>
            <p style="text-align: center; margin-top: 20px;">
              <a href="http://127.0.0.1:3000/" style="background-color: #007BFF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Acessar o Move</a>
            </p>
          </div>
          <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
            <p>Este e-mail foi enviado por <strong>Move Tradutor</strong>.</p>
            <p>Se você tiver alguma dúvida, entre em contato com a nossa equipe de suporte.</p>
          </footer>
        </div>
      `,
      };

      transporter.sendMail(mailOptions, (error: { message: string; }, info: { response: string; }) => {
           if (error) {
               return console.log('Erro ao enviar email: ' + error.message);
           }
           console.log('Email enviado: ' + info.response);
       });

    } catch (error) {
      return new Response(JSON.stringify({ error: error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const findUser = await prisma.upload.findFirst({
      where: {
        status : "PENDING"
      },
      select:{
        id : true,
      }
    });
    console.log(findUser);


    processNextInQueue();
    return new Response(
      JSON.stringify({ message: `Email adicionado na fila. Existem `}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new NextResponse(JSON.stringify({ error: error }), { status: 500 });
  }
}


