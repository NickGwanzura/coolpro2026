import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 15 * 60;

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME is not configured');
  return bucket;
}

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are not configured');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function buildCourseMaterialKey(courseId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `courses/${courseId}/${crypto.randomUUID()}-${safeName}`;
}

export function buildTechnicianPhotoKey(technicianId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `technician-photos/${technicianId}/${crypto.randomUUID()}-${safeName}`;
}

/**
 * contentLength is signed into the URL, so storage rejects any upload whose body is not exactly
 * that many bytes. Callers must pass the size they validated, not a value the client can change.
 */
export async function createMaterialUploadUrl(key: string, contentType: string, contentLength?: number): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
    ...(contentLength !== undefined ? { ContentLength: contentLength } : {}),
  });
  return getSignedUrl(getClient(), command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

/** fileName is sent as an attachment so browsers download the file instead of rendering it inline. */
export async function createMaterialDownloadUrl(key: string, fileName?: string): Promise<string> {
  const safeName = fileName?.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ResponseContentDisposition: safeName ? `attachment; filename="${safeName}"` : 'attachment',
  });
  return getSignedUrl(getClient(), command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}

/** Returns the stored object's size in bytes, or null when the object does not exist. */
export async function getMaterialSize(key: string): Promise<number | null> {
  try {
    const result = await getClient().send(new HeadObjectCommand({ Bucket: getBucketName(), Key: key }));
    return result.ContentLength ?? 0;
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw err;
  }
}

export async function deleteMaterial(key: string): Promise<void> {
  const command = new DeleteObjectCommand({ Bucket: getBucketName(), Key: key });
  await getClient().send(command);
}
