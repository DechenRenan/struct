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

function processNextInQueue() {
  console.log(processingQueue);
  if(processingQueue.length != 0 ){
    isProcessing = false;
    return;
  }

  isProcessing = true;

  const { audioFile, audioLevel, email} = processingQueue.shift()!;

  // Comando para executar o Whisper via linha de comando
  const whisperCommand = `whisper ${audioFile} --model ${audioLevel} --output_format txt --output_dir uploads --language Portuguese --task transcribe`;
  const fileNameWithExt = path.basename(audioFile);
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
        subject: 'Olá do novo tradutor do move',
        text: transcription,
    };

    transporter.sendMail(mailOptions, (error, info) => {
         if (error) {
             return console.log('Erro ao enviar email: ' + error.message);
         }
         console.log('Email enviado: ' + info.response);
         fs.unlinkSync(transcriptionPath);
         console.log('Arquivo apagado com sucesso.');
     });
  };
  const checkFileAndSendEmail = () => {
    const fileExists = fs.existsSync(transcriptionPath);
  
    if (fileExists) {
        const transcription = fs.readFileSync(transcriptionPath, 'utf-8');
        sendEmail(transcription);
        processNextInQueue();
    } else {
        console.log('Arquivo não encontrado. Tentando novamente em 10 segundos...');
        setTimeout(checkFileAndSendEmail, 10000); // Espera 10 segundos e tenta novamente
    }
  };
  checkFileAndSendEmail();

 
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
      },
    });

    
    // aqui eu quero abrir a o myenv do python executar o whisper com o audio designado. 

    try {
      const mailOptions = {
        from: 'dechenwhisper@gmail.com',
        to: email,
        subject: 'Olá do novo tradutor do move',
        text: 'aguarde que logo logo será enviado',
      };

      transporter.sendMail(mailOptions, (error, info) => {
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

    processingQueue.push({audioFile, audioLevel, email});
    if(!isProcessing){
      processNextInQueue();
    }
    const queueLength = processingQueue.length;
    console.log(queueLength);
    return new Response(
      JSON.stringify({ message: `Email adicionado na fila. Existem ${queueLength}` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new NextResponse(JSON.stringify({ error: error }), { status: 500 });
  }
}


