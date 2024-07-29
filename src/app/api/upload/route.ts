import { NextRequest, NextResponse } from 'next/server';
import formidable, { IncomingForm } from 'formidable';
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

export async function POST(req: NextRequest) {
  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  return new Promise<NextResponse>((resolve, reject) => {
    form.parse(req as any, async (err, fields, files) => {
      if (err) {
        return reject(new NextResponse(JSON.stringify({ error: err.message }), { status: 500 }));
      }

      const { audioLevel, email } = fields;
      const { audioFile } = files;

      try {
        // Save data to the database
        await prisma.upload.create({
          data: {
            email,
            audioLevel,
            audioFilePath: (audioFile as unknown as formidable.File).filepath,
          },
        });

        resolve(new NextResponse(JSON.stringify({ message: 'Dados recebidos com sucesso!' }), { status: 200 }));
      } catch (error) {
        resolve(new NextResponse(JSON.stringify({ error: error}), { status: 500 }));
      }
    });
  });
}
