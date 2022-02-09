/**
 * Normalize limit query param (page size).
 * @param {string} limit - The value of "limit" query param.
 * @param {number} [defaultLimit] - Default page size.
 * @param {number} [maxLimit] - Maximum allowed page size.
 * @return {number}
 */
function normalizeLimit(limit, defaultLimit = 10, maxLimit = 200) {
  limit = parseInt(limit || 0);
  if (!limit || limit < 0) return defaultLimit;
  if (limit > maxLimit) return maxLimit;
  return limit;
}

/**
 * Normalize sorting order query param.
 * @param {string} order - The value of "order" query param.
 * @param {string} [defaultOrder] - Default sorting order.
 * @return {string}
 */
function normalizeOrder(order, defaultOrder = 'asc') {
  if (order === 'asc' || order === 'desc') return order;
  return defaultOrder;
}

export class AssetQueryModel {
  /**
   * Retrieve parameters from HTTP request query.
   * @param {object} request - HTTP query request object.
   */
  constructor(request) {
    const { code, issuer, cursor, order, limit } = request.query,
      base = `${request.protocol}://${request.get('host')}${request.path}`;
    Object.assign(this, {
      // asset code filter (optional)
      code,
      // asset issuer filter (optional)
      issuer,
      // results cursor (optional)
      cursor,
      // result sorting order (optional, "asc" by default)
      order: normalizeOrder(order),
      // items per page (optional, 10 by default)
      limit: normalizeLimit(limit),
      // server base url
      base,
    });
  }
}
