function inverseOrder(order) {
  return order === 'asc' ? 'desc' : 'asc';
}

/**
 * Prepare standard API response with navigation links.
 * @param {AssetQueryModel} requestParams - Request parameters.
 * @param {Array} data - Result data.
 * @return {object}
 */
export function preparePagedData(requestParams, data) {
  // ensure paging_token
  for (let asset of data) {
    if (!asset.paging_token) {
      asset.paging_token = generatePagingToken(asset);
    }
  }
  // prepare cursors for navigation links
  const { base, order, limit, cursor = '' } = requestParams,
    currentCursorClause = cursor ? `\u0026cursor=${cursor}` : '',
    prevCursor = data.length ? data[0].paging_token : cursor,
    nextCursor = data.length ? data[data.length - 1].paging_token : cursor;

  return {
    _links: {
      self: {
        href: `${base}?order=${order}\u0026limit=${limit}${currentCursorClause}`,
      },
      prev: {
        href: `${base}?order=${inverseOrder(
          order
        )}\u0026limit=${limit}\u0026cursor=${prevCursor}`,
      },
      next: {
        href: `${base}?order=${order}\u0026limit=${limit}\u0026cursor=${nextCursor}`,
      },
    },
    _embedded: {
      records: data,
    },
  };
}

/**
 * Generate paging token for asset metadata.
 * @param assetMetadata
 * @return {string}
 */
export function generatePagingToken(assetMetadata) {
  const { code, issuer } = assetMetadata;
  // simple code-issuer format
  return `${code}-${issuer}`;
}
