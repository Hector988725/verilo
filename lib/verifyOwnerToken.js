export async function verifyOwnerToken(admin, listingId, token) {
  if (!listingId || !token) return false;
  const { data } = await admin.from('listings').select('manage_token').eq('id', listingId).single();
  return !!(data && data.manage_token && data.manage_token === token);
}
