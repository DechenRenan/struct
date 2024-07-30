import { NextRequest, NextResponse } from 'next/server';
import Busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

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
    // aqui eu quero abrir a o myenv do python executar o whisper com o audio designado. 

    const pythonScript = path.join(process.cwd(), '/uploads/transcribe.py');
    exec(`python3 ${pythonScript} ${audioFile} ${audioLevel}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Python script error: ${stderr}`);
        return;
      }

      // Read the transcription result
      const transcriptionPath = path.join(process.cwd(), 'transcription.txt');
      const transcription = fs.readFileSync(transcriptionPath, 'utf-8');

      // Send the transcription result via email
      const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: 'renandechen@pecege.com',
          pass: 'L@c4s4d3p4p3l',
        },
      });

      const mailOptions = {
        from: 'renandechen@pecege.com',
        to: email,
        subject: 'Resultado da transcrição',
        text: transcription,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`Error sending email: ${error.message}`);
        } else {
          console.log(`Email sent: ${info.response}`);
        }
      });
    });

    return new NextResponse(JSON.stringify({ message: 'Dados recebidos com sucesso!' }), { status: 200 });
  } catch (error) {
    console.log(error);
    return new NextResponse(JSON.stringify({ error: error }), { status: 500 });
  }
}
