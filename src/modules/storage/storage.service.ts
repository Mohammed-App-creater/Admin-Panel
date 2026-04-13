import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import r2 from "../../config/r2";
import { ENV, ENV as env } from "../../config/env";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "../../config/prisma";

const BUCKET = env.R2_BUCKET;
const PUBLIC_URL = env.PUBLIC_URL;



export const uploadFile = async (key: string, fileBuffer: Buffer, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key, 
    Body: fileBuffer,
    ContentType: contentType,
  });

  await r2.send(command);
  return `${PUBLIC_URL}/${key}`;
};

export const profilePicture = async (key: string, fileBuffer: Buffer, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await r2.send(command);
  return `${PUBLIC_URL}/${key}`;
};

export const paymentReceipt = async (key: string, fileBuffer: Buffer, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await r2.send(command);
  return `${PUBLIC_URL}/${key}`;
};

export const getSignedUrl = async (key: string, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  const url = await awsGetSignedUrl(r2, command, { expiresIn });

  return url;
};

export const updateProfilePictureForUser = async (
  userId: string,
  userRole: string,
  imageUrl: string
) => {
  if (userRole === "WORKER") {
    const worker = await prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw Object.assign(new Error("Worker profile not found"), { status: 404 });
    return prisma.worker.update({
      where: { userId },
      data: { profilePhoto: imageUrl },
    });
  }

  if (userRole === "COMPANY") {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) throw Object.assign(new Error("Company profile not found"), { status: 404 });
    return prisma.company.update({
      where: { userId },
      data: { companyLogo: imageUrl },
    });
  }

  throw Object.assign(new Error("Only WORKER or COMPANY can update profile picture"), { status: 403 });
};