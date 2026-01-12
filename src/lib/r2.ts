import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in environment (.env.local)`);
  return value;
}

export function createR2Client() {
  const accountId = requireEnv("R2_ACCOUNT_ID");

  const config: S3ClientConfig = {
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  };

  return new S3Client(config);
}

export async function createPresignedPutUrl(input: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const client = createR2Client();
  const bucket = requireEnv("R2_BUCKET_NAME");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
  });

  const expiresIn = input.expiresInSeconds ?? 60;
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return { uploadUrl };
}

/**
 * Direct upload to R2 (server-side, bypasses CORS issues)
 */
export async function uploadToR2Direct(input: {
  key: string;
  contentType: string;
  body: Buffer;
}) {
  const client = createR2Client();
  const bucket = requireEnv("R2_BUCKET_NAME");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
    Body: input.body,
  });

  await client.send(command);
}

export function publicUrlForR2Key(key: string) {
  const base = process.env.R2_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_R2_DOMAIN;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
