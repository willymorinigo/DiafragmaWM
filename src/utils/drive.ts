/**
 * Helper to upload a JSON backup of the photo portfolio directly to Google Drive
 * utilizing the multipart upload API.
 */
export async function uploadBackupToDrive(accessToken: string, backupData: any): Promise<{ id: string; name: string }> {
  const boundary = 'foo_bar_portfolio';
  
  // Create descriptive file name
  const dateStr = new Date().toISOString().split('T')[0];
  const metadata = {
    name: `MinimalPhotoPortfolio_Backup_${dateStr}.json`,
    mimeType: 'application/json',
    description: 'Respaldo automático del porfolio fotográfico Minimal Frame que contiene fotos categorizadas, colecciones curadas y metadatos.',
  };

  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(backupData, null, 2),
    `--${boundary}--`
  ].join('\r\n');

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Drive API raw error:', errorText);
    throw new Error(`Google Drive API error: ${response.statusText || 'Upload failed'}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    name: result.name || metadata.name,
  };
}
