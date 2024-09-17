import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { NextRequest, NextResponse } from 'next/server';
import Busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { Console } from 'console';


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
    const fileNameWithExt = path.basename(audioFile);
    const fileNameWithoutExt = path.basename(audioFile, path.extname(audioFile));
    console.log(fileNameWithoutExt);
    
    // aqui eu quero abrir a o myenv do python executar o whisper com o audio designado. 
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY, 
    });
    const bulkEmails: EmailParams[] = [];
    const sentFrom = new Sender("renandechen@pecege.com", "Renan Dechen");
    
    const pythonScript = path.join(process.cwd(), '/uploads/transcribe.py');
    console.log("arquivo sendo executado");

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
    // Comando para executar o Whisper via linha de comando
    const whisperCommand = `whisper ${audioFile} --model ${audioLevel} --output_format srt --output_dir uploads --language Portuguese --task transcribe`;

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

    const transcriptionPath = path.join(process.cwd(), `/uploads/${fileNameWithoutExt}.srt`);


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

      } else {
          console.log('Arquivo não encontrado. Tentando novamente em 10 segundos...');
          setTimeout(checkFileAndSendEmail, 10000); // Espera 10 segundos e tenta novamente
      }
    };


    checkFileAndSendEmail();


    return new Response(JSON.stringify({ message: "Emails sent successfully!" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log(error);
    return new NextResponse(JSON.stringify({ error: error }), { status: 500 });
  }
}


