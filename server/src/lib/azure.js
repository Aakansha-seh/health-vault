// Azure Blob Storage helper — issues short-lived SAS URLs so the browser can
// upload report files directly to Blob Storage (the file never passes through
// this API server). Config comes from env; if it's unset, uploads are simply
// reported as "not configured" and the rest of the app keeps working.
//
// Required env:
//   AZURE_STORAGE_CONNECTION_STRING   full connection string from the storage account
//   AZURE_STORAGE_CONTAINER           container name (default: "reports")
//
// The @azure/storage-blob package is imported lazily so the server still boots
// even before you've run `npm install` for it or configured Azure.

import crypto from 'crypto';

const CONTAINER = process.env.AZURE_STORAGE_CONTAINER || 'reports';

export const azureConfigured = () => !!process.env.AZURE_STORAGE_CONNECTION_STRING;

function parseConnectionString(conn) {
  const map = Object.fromEntries(
    conn.split(';').filter(Boolean).map((kv) => {
      const i = kv.indexOf('=');
      return [kv.slice(0, i), kv.slice(i + 1)];
    })
  );
  return {
    accountName: map.AccountName,
    accountKey:  map.AccountKey,
    endpoint:    map.BlobEndpoint || (map.AccountName ? `https://${map.AccountName}.blob.core.windows.net` : null),
  };
}

/**
 * Create a short-lived (15 min) write-only SAS URL for a new blob.
 * @returns {Promise<{ uploadUrl: string, blobUrl: string, blobName: string }>}
 *   uploadUrl — PUT the file bytes here (with header x-ms-blob-type: BlockBlob)
 *   blobUrl   — the permanent URL to store in the visit's testReports
 */
export async function createUploadSas(fileName, contentType = 'application/octet-stream') {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) {
    throw Object.assign(new Error('Azure storage is not configured'), { status: 503 });
  }

  // Lazy import so a missing package never crashes server startup.
  const {
    BlobServiceClient, StorageSharedKeyCredential,
    generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol,
  } = await import('@azure/storage-blob');

  const { accountName, accountKey, endpoint } = parseConnectionString(conn);
  if (!accountName || !accountKey) {
    throw Object.assign(new Error('Invalid AZURE_STORAGE_CONNECTION_STRING'), { status: 500 });
  }

  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const service    = BlobServiceClient.fromConnectionString(conn);
  const container   = service.getContainerClient(CONTAINER);
  await container.createIfNotExists();

  const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const blobName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER,
      blobName,
      permissions:   BlobSASPermissions.parse('cw'), // create + write
      startsOn:      new Date(Date.now() - 5 * 60 * 1000),
      expiresOn:     new Date(Date.now() + 15 * 60 * 1000),
      protocol:      SASProtocol.Https,
      contentType,
    },
    credential
  ).toString();

  const base    = endpoint.replace(/\/$/, '');
  const blobUrl = `${base}/${CONTAINER}/${blobName}`;
  return { uploadUrl: `${blobUrl}?${sas}`, blobUrl, blobName };
}
