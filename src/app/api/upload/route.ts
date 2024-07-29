import { NextRequest, NextResponse } from 'next/server';
import Busboy from 'busboy';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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
      writeStream.on('close', () => {
        files[fieldname] = saveTo;
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

    const { audioLevel, email } = fields;
    const audioFile = files.audioFile;

    // Save data to the database
    await prisma.upload.create({
      data: {
        email: email,
        audioLevel: audioLevel,
        audioFilePath: audioFile,
      },
    });

    return new NextResponse(JSON.stringify({ message: 'Dados recebidos com sucesso!' }), { status: 200 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: error }), { status: 500 });
  }
}
