/** Measured, purely logical board coordinates — no DOM and no rendering side effects. */
export const BOARD_MAX_COLS = 8;
export const BOARD_MAX_ROWS = 6;
export const BOARD_MIN_COLS = 4;
export const BOARD_MIN_ROWS = 3;
export const TARGET_CELL_PX = 44;
export const BOARD_MARGIN_PX = 9;

/** Fit as many whole cells as possible at >=44 CSS px, shrinking visible area on smaller devices. */
export function measureBoard(width, height, options = {}) {
  if (![width, height].every(v => Number.isFinite(v) && v > 0)) throw new RangeError('Board viewport dimensions must be positive');
  const padding = options.margin ?? BOARD_MARGIN_PX;
  if (!Number.isFinite(padding) || padding < 0) throw new RangeError('Invalid board margin');
  const usableWidth = width - 2 * padding;
  const usableHeight = height - 2 * padding;
  if (usableWidth <= 0 || usableHeight <= 0) throw new RangeError('Viewport has no room for board');
  const columns = Math.max(BOARD_MIN_COLS, Math.min(BOARD_MAX_COLS, Math.floor(usableWidth / TARGET_CELL_PX)));
  const rows = Math.max(BOARD_MIN_ROWS, Math.min(BOARD_MAX_ROWS, Math.floor(usableHeight / TARGET_CELL_PX)));
  const tile = Math.min(usableWidth / columns, usableHeight / rows);
  const mapWidth = columns * tile;
  const mapHeight = rows * tile;
  const x = (width - mapWidth) / 2;
  const y = (height - mapHeight) / 2;
  return Object.freeze({ width, height, columns, rows, tile, x, y, mapWidth, mapHeight });
}
export function cellRect(board, column, row) {
  if (!Number.isInteger(column) || !Number.isInteger(row) || column < 0 || row < 0 || column >= board.columns || row >= board.rows) return null;
  return Object.freeze({ x:board.x + column * board.tile, y:board.y + row * board.tile, width:board.tile, height:board.tile });
}
export function hitTestBoard(board, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x < board.x || y < board.y || x >= board.x + board.mapWidth || y >= board.y + board.mapHeight) return null;
  const column = Math.floor((x - board.x)/board.tile);
  const row = Math.floor((y - board.y)/board.tile);
  return column < board.columns && row < board.rows ? Object.freeze({column,row}) : null;
}
export function logicalPointFromClient(bounds, clientX, clientY) {
  return {x:clientX-bounds.left,y:clientY-bounds.top};
}
export function getTile(row, column) {
  const terrain=[
    'sssgssss',
    'smmsswss',
    'srsmswss',
    'ssssssgs',
    'sssmrsms',
    'gsssmmss'
  ];
  const code=terrain[row]?.[column] ?? 's';
  return ({s:'stone',m:'moss',w:'water',r:'rubble',g:'glyph'})[code];
}
